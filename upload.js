import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// 🔥 DEBUG
console.log("R2 BUCKET:", process.env.R2_BUCKET);
console.log("R2 ACCOUNT:", process.env.R2_ACCOUNT_ID);

if (!process.env.R2_BUCKET) {
  throw new Error("❌ R2_BUCKET topilmadi");
}

if (!process.env.R2_ACCOUNT_ID) {
  throw new Error("❌ R2_ACCOUNT_ID topilmadi");
}

const filePath = "./file.zip";

if (!fs.existsSync(filePath)) {
  throw new Error("❌ file.zip topilmadi");
}

// 🔥 CLOUDFARE R2 S3 CLIENT (TO‘G‘RI)
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function upload() {
  const fileStream = fs.createReadStream(filePath);

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: "forza-horizon-5.zip",
    Body: fileStream,
    ContentType: "application/zip",
  });

  try {
    const res = await client.send(command);
    console.log("🔥 UPLOAD SUCCESS");
    console.log(res);
  } catch (err) {
    console.error("❌ UPLOAD FAILED:");
    console.error(err);
  }
}

upload();