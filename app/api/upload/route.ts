import { PutObjectCommand } from "@aws-sdk/client-s3";
import { b2 } from "@/lib/b2";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function safeName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const slug = (formData.get("slug") as string) || "game";

    if (!file) {
      return Response.json({ error: "No file found" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const cleanSlug = safeName(slug);
    const baseName = safeName(file.name.replace(/\.[^.]+$/, ""));
    const ext = file.name.split(".").pop();

    const fileName = `${cleanSlug}/${Date.now()}-${baseName}.${ext}`;

    // 1. Upload to Backblaze
    await b2.send(
      new PutObjectCommand({
        Bucket: process.env.B2_BUCKET!,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    // 2. Save to Supabase (IMPORTANT FIX)
    await supabase
      .from("games")
      .update({
        file_path: fileName,
        download_type: "internal",
      })
      .eq("slug", cleanSlug);

    // 3. Return ONLY key (not fake URL)
    return Response.json({
      success: true,
      filePath: fileName,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message || "Upload failed" },
      { status: 500 }
    );
  }
}