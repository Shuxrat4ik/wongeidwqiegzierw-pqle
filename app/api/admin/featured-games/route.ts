import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';

const RLS_HINT =
  'Add SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY to .env.local and restart `next dev`, or run `supabase/migrations/20260515210000_games_rls_inline_no_function.sql` in the Supabase SQL Editor.';

function serverErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[api/admin/featured-games]', message);
  return NextResponse.json({ error: 'Internal Server Error', detail: message }, { status: 500 });
}

function featuredErrorResponse(
  error: { message?: string } | null,
  gate: { usingServiceRole: boolean }
) {
  const msg = error?.message ?? 'Unknown error';
  if (msg.includes('row-level security') && !gate.usingServiceRole) {
    return NextResponse.json({ error: 'Admin storefront RLS is not configured', detail: msg, hint: RLS_HINT }, { status: 403 });
  }
  return NextResponse.json({ error: msg }, { status: 400 });
}

export async function GET(req: NextRequest) {
  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.response;

    const { data: featuredRows, error: featuredError } = await gate.admin
      .from('featured_games')
      .select('*')
      .order('placement', { ascending: true })
      .order('sort_order', { ascending: true });

    if (featuredError) {
      return featuredErrorResponse(featuredError, gate);
    }

    if (!featuredRows || featuredRows.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    // Get game details for all featured games
    const gameIds = featuredRows.map((r: { game_id: string }) => r.game_id);
    const { data: games, error: gamesError } = await gate.admin
      .from('games')
      .select('*')
      .in('id', gameIds);

    if (gamesError) {
      return featuredErrorResponse(gamesError, gate);
    }

    // Map games by ID
    const gamesMap = new Map(
      (games || []).map((g: Record<string, unknown>) => [g.id, g])
    );

    // Merge featured_games with games
    const rows = featuredRows.map((row: { game_id: string } & Record<string, unknown>) => ({
      ...row,
      games: gamesMap.get(row.game_id) || null,
    }));

    return NextResponse.json({ rows });
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

    const { data: upsertResult, error: upsertError } = await gate.admin
      .from('featured_games')
      .upsert(body, { onConflict: 'game_id,placement' })
      .select('*')
      .maybeSingle();

    if (upsertError) {
      return featuredErrorResponse(upsertError, gate);
    }

    if (!upsertResult) {
      return NextResponse.json({ row: null });
    }

    // Get the game details
    const { data: game, error: gameError } = await gate.admin
      .from('games')
      .select('*')
      .eq('id', upsertResult.game_id)
      .maybeSingle();

    if (gameError) {
      return featuredErrorResponse(gameError, gate);
    }

    return NextResponse.json({ row: { ...upsertResult, games: game } });
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

    const { id: _omit, ...updates } = body;
    const { data: updateResult, error: updateError } = await gate.admin
      .from('featured_games')
      .update(updates)
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      return featuredErrorResponse(updateError, gate);
    }

    if (!updateResult) {
      return NextResponse.json({ row: null });
    }

    // Get the game details
    const { data: game, error: gameError } = await gate.admin
      .from('games')
      .select('*')
      .eq('id', updateResult.game_id)
      .maybeSingle();

    if (gameError) {
      return featuredErrorResponse(gameError, gate);
    }

    return NextResponse.json({ row: { ...updateResult, games: game } });
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

    const { error } = await gate.admin.from('featured_games').delete().eq('id', id);
    if (error) {
      return featuredErrorResponse(error, gate);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
