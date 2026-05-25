import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/http';
import { checkUserOwnsGame } from '@/lib/server/ownership';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const gameId = req.nextUrl.searchParams.get('gameId')?.trim();
    if (!gameId) return jsonError('gameId is required', 400);

    const admin = createServiceRoleClient();
    const owned = await checkUserOwnsGame(admin, gate.user.id, gameId);

    return NextResponse.json({ owned });
  } catch (err) {
    return serverError('api/library/ownership', err);
  }
}
