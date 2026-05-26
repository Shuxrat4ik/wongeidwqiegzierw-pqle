import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

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
  const file = fs.createReadStream("./file.zip");

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: "forza-horizon-5.zip",
    Body: file,
    ContentType: "application/zip",
  });

  try {
    const res = await client.send(command);
    console.log("🔥 UPLOAD SUCCESS");
    console.log(res);
  } catch (err) {
    console.error("❌ ERROR:");
    console.error(err);
  }
}

upload();