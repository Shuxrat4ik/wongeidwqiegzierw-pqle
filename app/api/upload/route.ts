import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createR2Client, publicR2Url, requireR2Config } from "@/lib/r2";
import { apiError, handleServerError } from "@/lib/server/error-handler";

export const runtime = "nodejs";

function safeName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const config = requireR2Config();
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return apiError('Invalid form data', 400);
    }
    
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return apiError('No file provided', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = safeName(file.name.split(".").pop() || "bin");
    const base = safeName(file.name.replace(/\.[^.]+$/, "")) || "file";
    const slug = safeName(String(formData.get("slug") || "uploads")) || "uploads";
    const key = `${slug}/${Date.now()}-${base}.${ext}`;

    await createR2Client().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const url = publicR2Url(key);

    return NextResponse.json({ key, path: key, url });
  } catch (err) {
    return handleServerError('api/upload', err);
  }
}
