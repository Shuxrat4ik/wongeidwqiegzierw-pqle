'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, Game } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Loader as Loader2,
  ArrowRight,
  Star,
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeDbGameRow } from '@/lib/db';
import { toast } from 'sonner';
import { isSeedGameId } from '@/lib/top-games';
import { isDatabaseGameId } from '@/lib/game-id';
import {
  openGameSite,
  removeSeedFromCollection,
  seedCollectionGames,
  SEED_COLLECTIONS_CHANGED
} from '@/lib/game-collections';

type WishlistEntry = {
  id: string;
  game: Game;
};

export default function WishlistPage() {
  const { user, userId, session } = useAuth();

  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // USER YO'Q BO'LSA
      if (!user?.id || !userId || userId === 'guest') {
        setItems([]);
        setCartIds(new Set());
        setLoading(false);
        return;
      }

      const [wishRes, cartRes] = await Promise.all([
        supabase
          .from('wishlist')
          .select('id, game_id, games(*)')
          .eq('user_id', user.id),

        supabase
          .from('cart')
          .select('game_id')
          .eq('user_id', user.id),
      ]);

      // ERROR CHECK
      if (wishRes.error) {
        console.error('Wishlist Error:', wishRes.error);
        toast.error(wishRes.error.message);
      }

      if (cartRes.error) {
        console.error('Cart Error:', cartRes.error);
      }

      const mapped: WishlistEntry[] = (wishRes.data ?? [])
        .filter((w: any) => w.games)
        .map((w: any) => ({
          id: w.id,
          game: normalizeDbGameRow(
            w.games as Record<string, unknown>
          ) as Game,
        }));

      const seedItems: WishlistEntry[] = seedCollectionGames(
        user.id,
        'wishlist'
      ).map((game) => ({
        id: `seed:${game.id}`,
        game,
      }));

      setItems([...mapped, ...seedItems]);

      setCartIds(
        new Set(
          (cartRes.data ?? []).map((c: any) => c.game_id)
        )
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [user, userId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    const refreshSeedCollections = () => {
      void fetchData();
    };

    window.addEventListener(
      SEED_COLLECTIONS_CHANGED,
      refreshSeedCollections
    );

    return () => {
      window.removeEventListener(
        SEED_COLLECTIONS_CHANGED,
        refreshSeedCollections
      );
    };
  }, [fetchData]);

  async function removeFromWishlist(
    wishlistId: string,
    title: string
  ) {
    try {
      setRemoving(wishlistId);

      if (wishlistId.startsWith('seed:')) {
        removeSeedFromCollection(
          userId,
          'wishlist',
          wishlistId.replace(/^seed:/, '')
        );

        setItems((prev) =>
          prev.filter((i) => i.id !== wishlistId)
        );

        toast.info(`${title} removed from wishlist`);
        return;
      }

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', wishlistId);

      if (error) {
        toast.error(error.message);
        return;
      }

      setItems((prev) =>
        prev.filter((i) => i.id !== wishlistId)
      );

      toast.success(`${title} removed from wishlist`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove game');
    } finally {
      setRemoving(null);
    }
  }

  async function addToCart(game: Game) {
    try {
      if (isSeedGameId(game.id)) {
        openGameSite(game);
        return;
      }

      if (!user?.id) {
        toast.error('Sign in to add games to your cart');
        return;
      }

      if (cartIds.has(game.id)) {
        toast.info('Already in cart');
        return;
      }

      if (!isDatabaseGameId(game.id)) {
        console.warn('[cart:add] blocked invalid gameId:', game.id);
        toast.error('This game is not available for cart yet');
        return;
      }

      setAdding(game.id);

      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ gameId: game.id }),
      });
      const payload = await res.json().catch(() => ({}));

      if (payload?.ok === false) {
        toast.error(typeof payload.error === 'string' ? payload.error : 'Failed to add to cart');
        return;
      }

      if (!res.ok) {
        toast.error(typeof payload.error === 'string' ? payload.error : 'Failed to add to cart');
        return;
      }

      setCartIds((prev) => {
        const next = new Set(prev);
        next.add(game.id);
        return next;
      });

      toast.success(`${game.title} added to cart`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to add to cart');
    } finally {
      setAdding(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center">
          <Heart className="w-5 h-5 text-sky-400" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">
            My Wishlist
          </h1>

          <p className="text-slate-400 text-sm">
            {items.length}{' '}
            {items.length === 1 ? 'game' : 'games'}
          </p>
        </div>
      </div>

      {!user && (
        <div className="text-center py-16 rounded-2xl bg-[#1a1a1a] border border-white/5 mb-6">
          <LogIn className="w-12 h-12 text-slate-600 mx-auto mb-3" />

          <p className="text-slate-400 mb-3">
            Sign in to save games to your wishlist
          </p>

          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-24 rounded-2xl bg-[#0A0E17] border border-white/5">
          <Heart className="w-16 h-16 text-slate-700 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-white mb-2">
            Your wishlist is empty
          </h2>

          <p className="text-slate-400 mb-6">
            Add games you want to buy later
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors"
          >
            Browse Store
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ id, game }, index) => {
            const isFree = game.price === 0;

            const discountedPrice =
              game.price *
              (1 - game.discount_percent / 100);

            const stars = Math.round(game.rating);

            const isSeed = isSeedGameId(game.id);

            const inCart = cartIds.has(game.id);

            return (
              <div
                key={`${id}-${game.id}-${index}`}
                className="flex gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-sky-500/20 transition-colors group"
              >
                <Link
                  href={`/games/${game.slug}`}
                  className="shrink-0"
                >
                  <img
                    src={game.cover_image}
                    alt={game.title}
                    className="w-20 h-28 rounded-lg bg-black object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/games/${game.slug}`}>
                    <h3 className="font-bold text-white text-base leading-tight mb-1 hover:text-sky-300 transition-colors">
                      {game.title}
                    </h3>
                  </Link>

                  <p className="text-slate-400 text-sm mb-2">
                    {game.developer}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-3 h-3',
                            i <= stars
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-600'
                          )}
                        />
                      ))}
                    </div>

                    <span className="text-xs text-slate-400">
                      {game.rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(game.genre ?? []).map((g) => (
                      <span
                        key={g}
                        className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end justify-between">
                  <div className="text-right">
                    {game.discount_percent > 0 && !isFree && (
                      <span className="text-xs text-slate-500 line-through block">
                        ${game.price.toFixed(2)}
                      </span>
                    )}

                    <span
                      className={cn(
                        'font-black text-lg',
                        isFree ? 'text-sky-400' : 'text-white'
                      )}
                    >
                      {isFree
                        ? 'FREE'
                        : `$${discountedPrice.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {!isFree && (
                      <button
                        onClick={() => addToCart(game)}
                        disabled={
                          !isSeed &&
                          (inCart || adding === game.id)
                        }
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                          !isSeed && inCart
                            ? 'bg-green-500/15 text-green-400 cursor-default border border-green-500/20'
                            : 'bg-sky-500 hover:bg-sky-400 text-white'
                        )}
                      >
                        {adding === game.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : !isSeed && inCart ? (
                          'In Cart'
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            {isSeed
                              ? 'Official Site'
                              : 'Add to Cart'}
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() =>
                        removeFromWishlist(id, game.title)
                      }
                      disabled={removing === id}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      {removing === id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
