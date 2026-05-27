import type { SupabaseClient } from "@supabase/supabase-js";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { checkUserOwnsGame } from "@/lib/server/ownership";

export const SIGNED_DOWNLOAD_TTL_SECONDS = 120;

const b2 = new S3Client({
  region: process.env.B2_REGION!,
  endpoint: process.env.B2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APP_KEY!,
  },
});

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

async function checkB2Object(key: string) {
  try {
    await b2.send(
      new HeadObjectCommand({
        Bucket: process.env.B2_BUCKET!,
        Key: key,
      })
    );
    return { ok: true };
  } catch (e) {
    return { ok: false };
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
      return { ok: false, status: 502, error: "DB error" };
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

    const owned = await checkUserOwnsGame(admin, userId, game.id);

    if (!owned) {
      return {
        ok: false,
        status: 403,
        error:
          game.price > 0
            ? "You do not own this game"
            : "Add this free game first",
      };
    }

    // 🔥 external link case
    if (game.download_type === "external") {
      await recordDownload(admin, userId, game.id);

      return {
        ok: true,
        game,
        url: game.download_url,
        expiresIn: null,
      };
    }

    // 🔥 B2 FLOW
    const key = game.download_path.replace(/^\/+/, "");

    const exists = await checkB2Object(key);

    if (!exists.ok) {
      return {
        ok: false,
        status: 404,
        error: "File not found in storage",
      };
    }

    const url = `${process.env.B2_ENDPOINT}/file/${process.env.B2_BUCKET}/${key}`;

    await recordDownload(admin, userId, game.id);

    return {
      ok: true,
      game,
      url,
      expiresIn: null,
    };
  } catch (err) {
    console.error("DOWNLOAD ERROR:", err);

    return {
      ok: false,
      status: 500,
      error: "Internal server error",
    };
  }
}