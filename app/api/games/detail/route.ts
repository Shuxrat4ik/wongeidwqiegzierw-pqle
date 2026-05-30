import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { normalizeDbGameRow } from '@/lib/db';
import { getTopGameBySlug, TOP_GAME_SEEDS } from '@/lib/top-games';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    // 1. GAME FETCH
    const { data: dbGame } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    const fallbackGame = getTopGameBySlug(slug);
    const merged = dbGame ?? fallbackGame;

    if (!merged) {
      return NextResponse.json({ game: null });
    }

    const game = normalizeDbGameRow(
      merged as unknown as Record<string, unknown>
    ) as any;

    // 🔥 SAFE GENRE FIX (MAIN FIX)
    const genre: string[] = Array.isArray(game.genre) ? game.genre : [];

    // 2. SEED GAME LOGIC
    const isSeed = TOP_GAME_SEEDS.some((g) => g.id === game.id);

    let related: any[] = [];

    if (isSeed) {
      related = TOP_GAME_SEEDS
        .filter(
          (item) =>
            item.id !== game.id &&
            item.genre.some((g) => genre.includes(g))
        )
        .slice(0, 4);
    } else {
      const { data: relatedData } = await supabase
        .from('games')
        .select('*')
        .neq('id', game.id)
        .overlaps('genre', genre)
        .limit(4);

      related = relatedData ?? [];
    }

    // 3. REVIEWS
    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, profiles(username)')
      .eq('game_id', game.id)
      .order('created_at', { ascending: false });

    // 4. OPTIONAL AUTH
    const userId = req.headers.get('x-user-id');

    let isOwned = false;
    let isWishlisted = false;
    let isInCart = false;

    let ownedIds: string[] = [];
    let wishlistIds: string[] = [];
    let cartIds: string[] = [];

    if (userId) {
      const [wish, cart, wishAll, cartAll] = await Promise.all([
        supabase
          .from('wishlist')
          .select('id')
          .eq('user_id', userId)
          .eq('game_id', game.id)
          .maybeSingle(),

        supabase
          .from('cart')
          .select('id')
          .eq('user_id', userId)
          .eq('game_id', game.id)
          .maybeSingle(),

        supabase
          .from('wishlist')
          .select('game_id')
          .eq('user_id', userId),

        supabase
          .from('cart')
          .select('game_id')
          .eq('user_id', userId),
      ]);

      isWishlisted = !!wish?.data;
      isInCart = !!cart?.data;

      wishlistIds = (wishAll.data ?? []).map((w: any) => w.game_id);
      cartIds = (cartAll.data ?? []).map((c: any) => c.game_id);

      ownedIds = isOwned ? [game.id] : [];
    }

    // 5. RESPONSE
    return NextResponse.json({
      game,
      reviews: reviews ?? [],
      related: related ?? [],

      isOwned,
      isWishlisted,
      isInCart,

      ownedIds,
      wishlistIds,
      cartIds,
    });
  } catch (err) {
    console.error('[API GAME DETAIL ERROR]', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}