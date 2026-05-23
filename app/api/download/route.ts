import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';
import { requireUser } from '@/lib/server/auth';
import { jsonError, serverError } from '@/lib/server/http';
import { createSignedGameDownload } from '@/lib/server/download-service';

export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const body = await req.json().catch(() => ({}));

    const gameId =
      typeof body.gameId === 'string'
        ? body.gameId.trim()
        : undefined;

    const slug =
      typeof body.slug === 'string'
        ? body.slug.trim()
        : undefined;

    if (!gameId && !slug) {
      return jsonError('gameId or slug is required', 400);
    }

    const supabase = createServiceRoleClient();

    const result = await createSignedGameDownload(
      supabase,
      gate.user.id,
      { gameId, slug }
    );

    if (!result.ok) {
      console.log('[DOWNLOAD ERROR]', result.error);
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      url: result.url,
      expiresIn: result.expiresIn,
      game: {
        id: result.game.id,
        title: result.game.title,
        slug: result.game.slug,
      },
    });

  } catch (err) {
    console.error('[api/download POST ERROR]', err);
    return serverError('api/download', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const gameId = req.nextUrl.searchParams
      .get('gameId')
      ?.trim() || undefined;

    const slug = req.nextUrl.searchParams
      .get('slug')
      ?.trim() || undefined;

    if (!gameId && !slug) {
      return jsonError('gameId or slug is required', 400);
    }

    const supabase = createServiceRoleClient();

    const result = await createSignedGameDownload(
      supabase,
      gate.user.id,
      { gameId, slug }
    );

    if (!result.ok) {
      console.log('[DOWNLOAD ERROR]', result.error);
      return jsonError(result.error, result.status);
    }

    return NextResponse.json({
      url: result.url,
      expiresIn: result.expiresIn,
      game: {
        id: result.game.id,
        title: result.game.title,
        slug: result.game.slug,
      },
    });

  } catch (err) {
    console.error('[api/download GET ERROR]', err);
    return serverError('api/download', err);
  }
}