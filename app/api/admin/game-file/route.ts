import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { GAME_FILES_BUCKET } from '@/lib/server/download-service';

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

  const { error } = await gate.admin.storage
    .from(GAME_FILES_BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ bucket: GAME_FILES_BUCKET, path });
}
