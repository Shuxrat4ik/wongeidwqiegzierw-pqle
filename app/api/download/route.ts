import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase-admin";
import { requireUser } from "@/lib/server/auth";
import { apiError, handleServerError } from "@/lib/server/error-handler";
import { createSignedGameDownload } from "@/lib/server/download-service";

/**
 * Extract params safely
 */
function getParams(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  return {
    gameId: searchParams.get("gameId")?.trim() || undefined,
    slug: searchParams.get("slug")?.trim() || undefined,
  };
}

/**
 * CORE LOGIC
 */
async function handleDownload(
  req: NextRequest,
  userId: string,
  gameId?: string,
  slug?: string
) {
  if (!gameId && !slug) {
    return apiError("gameId or slug is required", 400);
  }

  // 🔥 SAFETY: Supabase client
  const supabase = createServiceRoleClient();

  let result;
  try {
    result = await createSignedGameDownload(supabase, userId, {
      gameId,
      slug,
    });
  } catch (err) {
    console.error("[SIGNED DOWNLOAD ERROR]", err);
    return apiError("Failed to create download link", 500);
  }

  if (!result?.ok) {
    console.log("[DOWNLOAD ERROR]", result?.error, { gameId, slug });
    return apiError(result?.error || "Download failed", result?.status || 500);
  }

  return NextResponse.json({
    success: true,
    url: result.url,
    expiresIn: result.expiresIn,
    game: {
      id: result.game?.id,
      title: result.game?.title,
      slug: result.game?.slug,
    },
  });
}

/**
 * GET
 */
export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const { gameId, slug } = getParams(req);

    return await handleDownload(req, gate.user.id, gameId, slug);
  } catch (err) {
    console.error("[DOWNLOAD GET ERROR]", err);
    return handleServerError("api/download", err, { method: "GET" });
  }
}

/**
 * POST
 */
export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    let body: any;

    try {
      body = await req.json();
    } catch {
      return apiError("Invalid JSON body", 400);
    }

    const gameId =
      typeof body?.gameId === "string" ? body.gameId.trim() : undefined;

    const slug =
      typeof body?.slug === "string" ? body.slug.trim() : undefined;

    return await handleDownload(req, gate.user.id, gameId, slug);
  } catch (err) {
    console.error("[DOWNLOAD POST ERROR]", err);
    return handleServerError("api/download", err, { method: "POST" });
  }
}