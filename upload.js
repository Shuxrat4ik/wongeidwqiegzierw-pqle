const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { PutObjectCommand, S3Client } = require('@aws-sdk/client-s3');

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const filePath = process.argv[2] || './file.zip';
const objectKey = process.argv[3] || 'forza-horizon-5.zip';

function requiredEnv(name, aliases = []) {
  const value = [name, ...aliases].map((key) => process.env[key]?.trim()).find(Boolean);
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function upload() {
  const absoluteFilePath = path.resolve(filePath);

  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`File not found: ${absoluteFilePath}`);
  }

  const bucket = requiredEnv('R2_BUCKET', ['CLOUDFLARE_R2_BUCKET']);
  const accountId = requiredEnv('R2_ACCOUNT_ID', ['CLOUDFLARE_R2_ACCOUNT_ID']);
  const accessKeyId = requiredEnv('R2_ACCESS_KEY', ['CLOUDFLARE_R2_ACCESS_KEY']);
  const secretAccessKey = requiredEnv('R2_SECRET_KEY', ['CLOUDFLARE_R2_SECRET_ACCESS_KEY']);

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey.replace(/^\/+/, ''),
    Body: fs.createReadStream(absoluteFilePath),
    ContentType: 'application/zip',
  });

  await client.send(command);

  console.log('UPLOAD SUCCESS');
  console.log(`Bucket: ${bucket}`);
  console.log(`Key: ${objectKey}`);
}

upload().catch((err) => {
  console.error('UPLOAD ERROR');
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
