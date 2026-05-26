import { createHmac, createHash } from 'crypto';
import { S3Client } from '@aws-sdk/client-s3';

const R2_REGION = 'auto';
const S3_SERVICE = 's3';

function env(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return '';
}

function normalizeEndpoint(endpoint: string, bucket: string) {
  let normalized = endpoint.replace(/\/+$/, '');
  normalized = normalized.replace(new RegExp(`/${bucket.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
  return normalized;
}

export function getR2Config() {
  const bucket = env('CLOUDFLARE_R2_BUCKET', 'R2_BUCKET');
  const endpoint = normalizeEndpoint(env('CLOUDFLARE_R2_ENDPOINT', 'R2_ENDPOINT'), bucket);
  const accessKeyId = env('CLOUDFLARE_R2_ACCESS_KEY', 'R2_ACCESS_KEY', 'AWS_ACCESS_KEY_ID');
  const secretAccessKey = env('CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'R2_SECRET_KEY', 'AWS_SECRET_ACCESS_KEY');
  const publicBaseUrl = env('CLOUDFLARE_R2_PUBLIC_URL', 'R2_PUBLIC_URL');

  return { bucket, endpoint, accessKeyId, secretAccessKey, publicBaseUrl };
}

export function requireR2Config() {
  const config = getR2Config();
  const missing = Object.entries({
    CLOUDFLARE_R2_BUCKET: config.bucket,
    CLOUDFLARE_R2_ENDPOINT: config.endpoint,
    CLOUDFLARE_R2_ACCESS_KEY: config.accessKeyId,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: config.secretAccessKey,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing R2 environment variables: ${missing.join(', ')}`);
  }

  if (/^https?:\/\//i.test(config.secretAccessKey)) {
    throw new Error('CLOUDFLARE_R2_SECRET_ACCESS_KEY must be the R2 secret key, not a URL');
  }

  return config;
}

export function validateR2Config(): { ok: boolean; error?: string } {
  const config = getR2Config();
  const missing = Object.entries({
    CLOUDFLARE_R2_BUCKET: config.bucket,
    CLOUDFLARE_R2_ENDPOINT: config.endpoint,
    CLOUDFLARE_R2_ACCESS_KEY: config.accessKeyId,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: config.secretAccessKey,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length > 0) {
    return { ok: false, error: `Missing R2 environment variables: ${missing.join(', ')}` };
  }

  if (/^https?:\/\//i.test(config.secretAccessKey)) {
    return { ok: false, error: 'CLOUDFLARE_R2_SECRET_ACCESS_KEY must be the R2 secret key, not a URL' };
  }

  return { ok: true };
}

export function createR2Client() {
  const config = requireR2Config();

  return new S3Client({
    region: R2_REGION,
    endpoint: config.endpoint,
    forcePathStyle: true, // <--- Buni albatta qo'shing
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export const r2 = {
  send(command: Parameters<S3Client['send']>[0]) {
    return createR2Client().send(command);
  },
};

function hmac(key: Buffer | string, value: string) {
  return createHmac('sha256', key).update(value).digest();
}

function sha256Hex(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function signingKey(secretAccessKey: string, date: string) {
  const kDate = hmac(`AWS4${secretAccessKey}`, date);
  const kRegion = hmac(kDate, R2_REGION);
  const kService = hmac(kRegion, S3_SERVICE);
  return hmac(kService, 'aws4_request');
}

export function publicR2Url(key: string) {
  const config = getR2Config();
  if (!config.publicBaseUrl) return null;
  // Remove leading slashes and strip any nested bucket names that might already be in the key
  let cleanKey = key.replace(/^\/+/, '');
  // Strip bucket prefix if present (can appear multiple times due to malformed paths)
  const bucketPrefix = `${config.bucket}/`;
  while (cleanKey.startsWith(bucketPrefix)) {
    cleanKey = cleanKey.slice(config.bucket.length + 1);
  }
  return `${config.publicBaseUrl.replace(/\/+$/, '')}/${encodePath(cleanKey)}`;
}

export function createR2SignedUrl(key: string, expiresIn = 120) {
  const config = requireR2Config();
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const host = new URL(config.endpoint).host;
  const credentialScope = `${dateStamp}/${R2_REGION}/${S3_SERVICE}/aws4_request`;
  const credential = `${config.accessKeyId}/${credentialScope}`;
  const safeExpires = Math.min(Math.max(Math.floor(expiresIn), 1), 604800);
  
  // Remove leading slashes and strip any nested bucket names that might already be in the key
  let cleanKey = key.replace(/^\/+/, '');
  const bucketPrefix = `${config.bucket}/`;
  while (cleanKey.startsWith(bucketPrefix)) {
    cleanKey = cleanKey.slice(config.bucket.length + 1);
  }
  const encodedKey = encodePath(cleanKey);

  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': credential,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(safeExpires),
    'X-Amz-SignedHeaders': 'host',
  });

  const canonicalQueryString = Array.from(params.entries())
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .sort()
    .join('&');
  
  // With forcePathStyle: true, the canonical URI must include the bucket name
  const canonicalUri = `/${config.bucket}/${encodedKey}`;
  
  const canonicalRequest = [
    'GET',
    canonicalUri,
    canonicalQueryString,
    `host:${host}`,
    '',
    'host',
    'UNSIGNED-PAYLOAD',
  ].join('\n');
  
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');
  
  const signature = createHmac('sha256', signingKey(config.secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest('hex');

  params.set('X-Amz-Signature', signature);

  return `${config.endpoint}/${config.bucket}/${encodedKey}?${params.toString()}`;
}
