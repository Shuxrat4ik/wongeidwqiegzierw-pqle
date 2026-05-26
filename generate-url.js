import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID;
const accessKey = process.env.R2_ACCESS_KEY;
const secretKey = process.env.R2_SECRET_KEY;
const bucket = process.env.R2_BUCKET;

const fileName = "forza-horizon-5.zip";
const method = "PUT";

const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${fileName}`;

function sign(stringToSign, secret) {
  return crypto.createHmac("sha256", secret).update(stringToSign).digest("hex");
}

const date = new Date().toISOString();

const signature = sign(`${method}\n${fileName}\n${date}`, secretKey);

const signedUrl = `${endpoint}?X-Signature=${signature}&X-Date=${date}&X-Key=${accessKey}`;

console.log("SIGNED URL:\n", signedUrl);
