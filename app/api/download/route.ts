import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/server/auth";
import { apiError, handleServerError } from "@/lib/server/error-handler";
import { createSignedGameDownload } from "@/lib/server/download-service";

function getParams(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  return {
    gameId: searchParams.get("gameId")?.trim() || undefined,
    slug: searchParams.get("slug")?.trim() || undefined,
  };
}

async function handleDownload(
  req: NextRequest,
  userId: string,
  gameId?: string,
  slug?: string
) {
  if (!gameId && !slug) {
    return apiError("gameId or slug is required", 400);
  }

  const supabase = createServiceRoleClient();

  const result = await createSignedGameDownload(supabase, userId, {
    gameId,
    slug,
  });

  if (!result?.ok) {
    return apiError(result?.error || "Download failed", result?.status || 500);
  }

  return NextResponse.json({
    success: true,
    url: result.url,
    expiresIn: result.expiresIn ?? null,
    game: result.game
      ? {
          id: result.game.id,
          title: result.game.title,
          slug: result.game.slug,
        }
      : null,
  });
}

/**
 * GET → AUTH REQUIRED
 */
export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);

    if (!gate.ok) {
      return gate.response;
    }

    const { gameId, slug } = getParams(req);

    return await handleDownload(req, gate.user.id, gameId, slug);
  } catch (err) {
    return handleServerError("api/download", err, { method: "GET" });
  }
}

/**
 * POST → AUTH REQUIRED
 */
export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);

    if (!gate.ok) {
      return gate.response;
    }

    const body = await req.json().catch(() => null);

    if (!body) {
      return apiError("Invalid JSON body", 400);
    }

    const gameId =
      typeof body.gameId === "string" ? body.gameId.trim() : undefined;

    const slug =
      typeof body.slug === "string" ? body.slug.trim() : undefined;

    return await handleDownload(req, gate.user.id, gameId, slug);
  } catch (err) {
    return handleServerError("api/download", err, { method: "POST" });
  }
}