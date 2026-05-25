import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { requireAdmin } from '@/lib/require-admin';
import { createR2Client, requireR2Config } from '@/lib/r2';

export const runtime = 'nodejs';

function safeName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return gate.response;

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const slug = safeName(String(form?.get('slug') || 'game'));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const ext = safeName(file.name.split('.').pop() || 'bin');
  const base = safeName(file.name.replace(/\.[^.]+$/, '')) || 'installer';
  const path = `${slug}/${Date.now()}-${base}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const config = requireR2Config();

    await createR2Client().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: path,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    const status = message.includes('environment variables') || message.includes('secret key') ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ path });
}
