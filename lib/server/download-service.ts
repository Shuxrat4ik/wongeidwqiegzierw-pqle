import type { SupabaseClient } from "@supabase/supabase-js";
import {
  checkR2Object,
  createR2SignedUrl,
  publicR2Url,
  validateR2Config,
} from "@/lib/r2";
import { checkUserOwnsGame } from "@/lib/server/ownership";

export const SIGNED_DOWNLOAD_TTL_SECONDS = 120;

async function recordDownload(
  admin: SupabaseClient,
  userId: string,
  gameId: string
) {
  const { error } = await admin.from("downloads").insert({
    user_id: userId,
    game_id: gameId,
  });

  if (error) {
    console.warn("[download] could not record download:", error.message);
  }
}

export async function createSignedGameDownload(
  admin: SupabaseClient,
  userId: string,
  params: { gameId?: string; slug?: string }
) {
  try {
    const selector = admin
      .from("games")
      .select(
        "id, title, slug, download_path, download_url, download_type, price"
      )
      .eq(params.gameId ? "id" : "slug", params.gameId ?? params.slug);

    const { data: game, error: gameError } = await selector.maybeSingle();

    if (gameError) {
      console.error("DB ERROR:", gameError);
      return { ok: false, status: 502, error: "Could not load game data" };
    }

    if (!game) {
      return { ok: false, status: 404, error: "Game not found" };
    }

    if (!game.download_path?.trim()) {
      return {
        ok: false,
        status: 400,
        error: "No download path configured",
      };
    }

    // 🔥 ownership check
    const owned = await checkUserOwnsGame(admin, userId, game.id);

    if (!owned) {
      return {
        ok: false,
        status: 403,
        error:
          game.price > 0
            ? "You do not own this game"
            : "Add this free game to your library first",
      };
    }

    // 🔥 external download case
    if (game.download_type === "drive" || game.download_type === "external") {
      if (!game.download_url?.trim()) {
        return {
          ok: false,
          status: 400,
          error: "No download URL configured",
        };
      }

      await recordDownload(admin, userId, game.id);

      return {
        ok: true,
        game,
        url: game.download_url,
        expiresIn: null,
      };
    }

    // 🔥 R2 FLOW
    const path = game.download_path.trim().replace(/^\/+/, "");

    const r2Check = validateR2Config();
    if (!r2Check.ok) {
      return {
        ok: false,
        status: 503,
        error: "R2 config error: " + r2Check.error,
      };
    }

    const objectCheck = await checkR2Object(path);

    if (!objectCheck.ok) {
      return {
        ok: false,
        status: objectCheck.status,
        error: "File not found in R2",
      };
    }

    const publicUrl = publicR2Url(path);
    const url =
      publicUrl ?? createR2SignedUrl(path, SIGNED_DOWNLOAD_TTL_SECONDS);

    await recordDownload(admin, userId, game.id);

    return {
      ok: true,
      game,
      url,
      expiresIn: publicUrl ? null : SIGNED_DOWNLOAD_TTL_SECONDS,
    };
  } catch (err) {
    console.error("FATAL DOWNLOAD ERROR:", err);

    return {
      ok: false,
      status: 500,
      error: "Internal download service error",
    };
  }
}