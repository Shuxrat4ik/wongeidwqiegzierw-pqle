import { PutObjectCommand } from "@aws-sdk/client-s3";
import { b2 } from "@/lib/b2";


export const runtime = "nodejs";

function safeName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return Response.json({ error: "No file found" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const fileName = `${Date.now()}-${file.name}`;

  await b2.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET!,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })
  );

  const url = `${process.env.B2_ENDPOINT}/file/${process.env.B2_BUCKET}/${fileName}`;

  return Response.json({
    success: true,
    url,
    fileName,
  });
}
