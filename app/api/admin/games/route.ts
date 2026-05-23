import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { sanitizeGameInsert, sanitizeGamePatch } from '@/lib/admin-game-payload';

const RLS_HINT =
  'Add SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY to .env.local and restart `next dev`, or run `supabase/migrations/20260515210000_games_rls_inline_no_function.sql` in the Supabase SQL Editor.';

function serverErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[api/admin/games]', message);
  return NextResponse.json({ error: 'Internal Server Error', detail: message }, { status: 500 });
}

function gamesErrorResponse(
  error: { message?: string } | null,
  gate: { usingServiceRole: boolean }
) {
  const msg = error?.message ?? 'Unknown error';
  if (msg.includes('row-level security') && !gate.usingServiceRole) {
    return NextResponse.json({ error: 'Admin catalog RLS is not configured', detail: msg, hint: RLS_HINT }, { status: 403 });
  }
  return NextResponse.json({ error: msg }, { status: 400 });
}

async function insertGame(gate: { admin: any }, row: Record<string, unknown>) {
  const { data, error } = await gate.admin.from('games').insert(row).select().maybeSingle();
  if (error?.message?.includes("Could not find the 'videos' column")) {
    const { videos: _videos, ...fallbackRow } = row;
    return gate.admin.from('games').insert(fallbackRow).select().maybeSingle();
  }
  return { data, error };
}

async function updateGame(gate: { admin: any }, id: string, updates: Record<string, unknown>) {
  const { data, error } = await gate.admin.from('games').update(updates).eq('id', id).select().maybeSingle();
  if (error?.message?.includes("Could not find the 'videos' column")) {
    const { videos: _videos, ...fallbackUpdates } = updates;
    return gate.admin.from('games').update(fallbackUpdates).eq('id', id).select().maybeSingle();
  }
  return { data, error };
}

export async function GET(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.response;

    const { data, error } = await gate.admin.from('games').select('*').order('title', { ascending: true });
    if (error) {
      console.error('[api/admin/games] Query error:', error.message);
      return gamesErrorResponse(error, gate);
    }
    
    const gameCount = Array.isArray(data) ? data.length : 0;
    console.log('[api/admin/games] GET success, usingServiceRole:', gate.usingServiceRole, 'count:', gameCount);
    return NextResponse.json({ games: data ?? [] });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.response;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const row = sanitizeGameInsert(body);
    const { data, error } = await insertGame(gate, row);
    if (error) {
      return gamesErrorResponse(error, gate);
    }
    return NextResponse.json({ game: data });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.response;

    let body: { id?: string } & Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const id = body.id;
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Body must include string id' }, { status: 400 });
    }

    const updates = sanitizeGamePatch(body);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    const { data, error } = await updateGame(gate, id, updates);
    if (error) {
      return gamesErrorResponse(error, gate);
    }
    return NextResponse.json({ game: data });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.response;

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing query id' }, { status: 400 });
    }

    const { error } = await gate.admin.from('games').delete().eq('id', id);
    if (error) {
      return gamesErrorResponse(error, gate);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
