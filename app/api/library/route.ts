import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/server/auth';
import { handleServerError } from '@/lib/server/error-handler';
import { getUserOwnedGameEntries } from '@/lib/server/ownership';
import { normalizeDbGameRow } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const admin = createServiceRoleClient();
    const ownership = await getUserOwnedGameEntries(admin, gate.user.id);
    const gameIds = ownership.map((entry) => entry.gameId);

    if (gameIds.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const { data: games, error: gamesError } = await admin
      .from('games')
      .select('*')
      .in('id', gameIds);

    if (gamesError) throw gamesError;

    const gamesById = new Map(
      (games ?? []).map((game: Record<string, unknown>) => [String(game.id), normalizeDbGameRow(game)])
    );

    const items = ownership
      .map((entry) => {
        const game = gamesById.get(entry.gameId);
        if (!game) return null;
        return {
          id: `${entry.source}:${entry.gameId}`,
          game,
          acquired_at: entry.acquiredAt,
          source: entry.source,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (err) {
    return handleServerError('api/library', err);
  }
}
