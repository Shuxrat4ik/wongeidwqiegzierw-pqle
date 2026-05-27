import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { requireAdmin } from "@/lib/require-admin";

export const runtime = "nodejs";

const b2 = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
});

function safeName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const slug = safeName(String(form?.get("slug") || "game"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const ext = safeName(file.name.split(".").pop() || "bin");
  const base = safeName(file.name.replace(/\.[^.]+$/, "")) || "installer";

  const path = `${slug}/${Date.now()}-${base}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await b2.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET!,
        Key: path,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ path });
}