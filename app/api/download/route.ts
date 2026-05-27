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
  try {
    if (!gameId && !slug) {
      return apiError("gameId or slug is required", 400);
    }

    const supabase = createServiceRoleClient();

    console.log("🔍 DOWNLOAD REQUEST:", { userId, gameId, slug });

    const result = await createSignedGameDownload(supabase, userId, {
      gameId,
      slug,
    });

    console.log("📦 DOWNLOAD RESULT:", result);

    if (!result) {
      return apiError("No response from download service", 500);
    }

    if (!result.ok) {
      return apiError(result.error || "Download failed", result.status || 500);
    }

    if (!result.url) {
      return apiError("Download URL not generated", 500);
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      expiresIn: result.expiresIn ?? null,
      game: {
        id: result.game?.id ?? null,
        title: result.game?.title ?? null,
        slug: result.game?.slug ?? null,
      },
    });
  } catch (err: any) {
    console.error("💥 HANDLE DOWNLOAD CRASH:", err);
    return apiError(err?.message || "Internal error", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { gameId, slug } = getParams(req);

    // 🔥 authsiz ishlatamiz
    const userId = "guest-user";

    return await handleDownload(req, userId, gameId, slug);
  } catch (err) {
    console.error("[DOWNLOAD GET ERROR]", err);
    return handleServerError("api/download", err, { method: "GET" });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireUser(req);

    if (!gate.ok) {
      console.log("❌ AUTH FAILED");
      return gate.response;
    }

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