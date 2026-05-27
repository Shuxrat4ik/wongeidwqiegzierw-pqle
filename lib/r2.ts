import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function requireR2Config() {
  return {
    bucket: env("B2_BUCKET"),
    endpoint: env("B2_ENDPOINT"),
    accessKeyId: env("B2_KEY_ID"),
    secretAccessKey: env("B2_APP_KEY"),
  };
}

export function createR2Client() {
  const cfg = requireR2Config();

  return new S3Client({
    region: "auto",
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

export async function checkR2Object(key: string) {
  try {
    const client = createR2Client();
    const cfg = requireR2Config();

    await client.send(
      new HeadObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      })
    );

    return { ok: true };
  } catch (err: any) {
    return { ok: false, status: 404 };
  }
}

export function publicR2Url(key: string) {
  const cfg = requireR2Config();

  // public bucket bo‘lsa ishlaydi
  return `${cfg.endpoint}/${cfg.bucket}/${key}`;
}

export async function createR2SignedUrl(
  key: string,
  expiresIn = 120
) {
  const client = createR2Client();
  const cfg = requireR2Config();

  const command = new HeadObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, {
  expiresIn,
  });
}

export function validateR2Config() {
  try {
    requireR2Config();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}