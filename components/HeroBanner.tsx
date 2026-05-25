'use client';

import { Game } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { GAME_IMAGE_FALLBACK, isSeedGameId } from '@/lib/top-games';
import { useAuth } from '@/lib/auth';
import { Star, Download, ShoppingCart, Heart, Play, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/useMounted';
import { toast } from 'sonner';
import { claimFreeGameAndDownload, startVerifiedDownload } from '@/lib/game-download-client';
import { isDatabaseGameId } from '@/lib/game-id';
import { addSeedToCollection, openGameSite, readSeedCollection, toggleSeedWishlist } from '@/lib/game-collections';

interface HeroBannerProps {
  games: Game[];
  ownedIds: Set<string>;
}

export default function HeroBanner({ games, ownedIds }: HeroBannerProps) {
  const { user, userId, session } = useAuth();
  const mounted = useMounted();
  const [current, setCurrent] = useState(0);
  const [inCart, setInCart] = useState<Set<string>>(new Set());
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const game = games[current];
  const isOwned = game ? ownedIds.has(game.id) : false;
  const isFree = game?.price === 0;
  const hasDiscount = game ? game.discount_percent > 0 : false;
  const discountedPrice = game ? game.price * (1 - game.discount_percent / 100) : 0;
  const stars = game ? Math.round(game.rating) : 0;
  const isSeed = isSeedGameId(game?.id);

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % games.length);
  }, [games.length]);

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + games.length) % games.length);
  }, [games.length]);

  useEffect(() => {
    if (games.length === 0) {
      setCurrent(0);
      return;
    }
    setCurrent(c => Math.min(c, games.length - 1));
  }, [games]);

  useEffect(() => {
    if (games.length <= 1) return;
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [games.length, next]);

  useEffect(() => {
    if (!mounted || !user || userId === 'guest') return;
    async function fetchStatus() {
      if (!game) return;
      const [cartRes, wishRes] = await Promise.all([
        supabase.from('cart').select('game_id').eq('user_id', userId),
        supabase.from('wishlist').select('game_id').eq('user_id', userId),
      ]);
      setInCart(new Set((cartRes.data ?? []).map((c: any) => c.game_id)));
      setWishlisted(new Set([
        ...(wishRes.data ?? []).map((w: any) => w.game_id),
        ...Array.from(readSeedCollection(userId, 'wishlist')),
      ]));
    }
    fetchStatus();
  }, [userId, current, mounted, game, user]);

  async function addToCart() {
    if (!game || inCart.has(game.id) || isOwned) return;
    if (isSeed) {
      openGameSite(game);
      return;
    }
    if (!user) {
      toast.error('Sign in to add games to your cart');
      return;
    }
    if (!isDatabaseGameId(game.id)) {
      console.warn('[cart:add] blocked invalid gameId:', game.id);
      toast.error('This game is not available for cart yet');
      return;
    }
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
      toast.error(typeof payload.error === 'string' ? payload.error : 'Could not add to cart');
      return;
    }
    if (!res.ok) {
      toast.error(typeof payload.error === 'string' ? payload.error : 'Could not add to cart');
      return;
    }
    setInCart(prev => { const n = new Set(Array.from(prev)); n.add(game.id); return n; });
    toast.success(`${game.title} added to cart`);
  }

  async function toggleWishlist() {
    if (!game) return;
    if (isSeed) {
      if (!user) {
        toast.error('Sign in to use your wishlist');
        return;
      }
      const added = toggleSeedWishlist(userId, game);
      setWishlisted(prev => {
        const n = new Set(Array.from(prev));
        if (added) n.add(game.id);
        else n.delete(game.id);
        return n;
      });
      if (added) toast.success('Added to wishlist');
      else toast.info('Removed from wishlist');
      return;
    }
    if (!user) {
      toast.error('Sign in to use your wishlist');
      return;
    }
    if (!isDatabaseGameId(game.id)) {
      console.warn('[wishlist:add] blocked invalid gameId:', game.id);
      toast.error('This game is not available for wishlist yet');
      return;
    }
    if (wishlisted.has(game.id)) {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', userId).eq('game_id', game.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setWishlisted(prev => { const n = new Set(Array.from(prev)); n.delete(game.id); return n; });
      toast.info('Removed from wishlist');
    } else {
      const res = await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ gameId: game.id }),
      });
      const payload = await res.json().catch(() => ({}));
      if (payload?.ok === false) {
        toast.error(typeof payload.error === 'string' ? payload.error : 'Failed to add to wishlist');
        return;
      }
      if (!res.ok) {
        toast.error(typeof payload.error === 'string' ? payload.error : 'Failed to add to wishlist');
        return;
      }
      setWishlisted(prev => { const n = new Set(Array.from(prev)); n.add(game.id); return n; });
      toast.success('Added to wishlist');
    }
  }

  function downloadSeedGame() {
    if (!game) return;
    if (user) {
      addSeedToCollection(userId, 'library', game);
      toast.success(`${game.title} added to your library`);
    } else {
      toast.info('Sign in to save this game to your library');
    }
    openGameSite(game);
  }

  if (!game) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="group relative h-[430px] w-full overflow-hidden rounded-lg md:h-[560px]">
        {games.map((g, i) => (
          <img
            key={`${g.id}-${i}`}
            src={g.banner_image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0 }}
            onError={e => { e.currentTarget.src = GAME_IMAGE_FALLBACK; }}
          />
        ))}

        <div className="hero-gradient absolute inset-0" />

        {games.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous featured game"
              className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/70 opacity-0 backdrop-blur transition-all hover:bg-black/70 hover:text-white group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              aria-label="Next featured game"
              className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white/70 opacity-0 backdrop-blur transition-all hover:bg-black/70 hover:text-white group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 md:p-12">
          <div className="max-w-xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {isFree && <span className="badge-free rounded px-2.5 py-1 text-xs font-bold text-white">FREE TO PLAY</span>}
              {hasDiscount && !isFree && <span className="badge-discount rounded px-2.5 py-1 text-xs font-bold text-white">-{game.discount_percent}% OFF</span>}
              {isOwned && <span className="badge-owned rounded px-2.5 py-1 text-xs font-bold text-white">IN YOUR LIBRARY</span>}
              <span className="rounded bg-white/10 px-2.5 py-1 text-xs font-medium text-white/75 backdrop-blur">{(game.genre ?? [])[0] ?? 'Game'}</span>
            </div>

            <h1 className="mb-2 text-3xl font-black leading-tight text-white md:text-5xl">{game.title}</h1>

            <div className="mb-3 flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`h-4 w-4 ${i <= stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                ))}
              </div>
              <span className="text-sm text-slate-300">{game.rating.toFixed(1)} · {game.review_count.toString()} reviews</span>
            </div>

            <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-slate-200">{game.short_description}</p>

            <div className="flex flex-wrap items-center gap-3">
              {!isFree && !isOwned && (
                <div className="mr-1 flex flex-col">
                  {hasDiscount && <span className="text-xs leading-none text-slate-400 line-through">${game.price.toFixed(2)}</span>}
                  <span className="text-2xl font-black text-white">${discountedPrice.toFixed(2)}</span>
                </div>
              )}

              {isOwned ? (
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    if (isSeed) downloadSeedGame();
                    else void claimFreeGameAndDownload(supabase, { gameId: game.id, slug: game.slug });
                  }}
                  className="flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-slate-200"
                >
                  <Play className="h-4 w-4 fill-current" /> Play Now
                </button>
              ) : isFree ? (
                <button
                  type="button"
                  onClick={e => {
                    e.preventDefault();
                    if (isSeed) downloadSeedGame();
                    else void startVerifiedDownload(supabase, game.slug);
                  }}
                  className="flex items-center gap-2 rounded bg-white px-6 py-3 text-sm font-bold text-black transition-colors hover:bg-slate-200"
                >
                  <Download className="h-4 w-4" /> Download Free
                </button>
              ) : (
                <button
                  onClick={addToCart}
                  disabled={inCart.has(game.id)}
                  className={cn(
                    'flex items-center gap-2 rounded px-6 py-3 text-sm font-bold transition-colors',
                    inCart.has(game.id)
                      ? 'border border-green-500/30 bg-green-500/20 text-green-400'
                      : 'bg-white text-black hover:bg-slate-200'
                  )}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isSeed ? 'Official Site' : inCart.has(game.id) ? 'In Cart' : 'Add to Cart'}
                </button>
              )}

              <Link
                href={`/games/${game.slug}`}
                className="flex items-center gap-2 rounded bg-white/10 px-4 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <Info className="h-4 w-4" /> Details
              </Link>

              <button
                onClick={toggleWishlist}
                aria-label={wishlisted.has(game.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                className={cn(
                  'rounded border p-3 backdrop-blur transition-colors',
                  wishlisted.has(game.id)
                    ? 'border-sky-500/40 bg-sky-500/20 text-sky-400'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <Heart className={cn('h-4 w-4', wishlisted.has(game.id) && 'fill-current')} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {games.length > 1 && (
        <div className="hidden min-h-0 flex-col gap-2 lg:flex">
          {games.slice(0, 6).map((item, index) => (
            <button
              key={`${item.id}-${item.slug}-${index}`}
              onClick={() => setCurrent(index)}
              className={cn(
                'flex h-[84px] items-center gap-3 rounded-lg p-2 text-left transition-colors',
                current === index ? 'bg-white/[0.12]' : 'hover:bg-white/[0.07]'
              )}
            >
              <img src={item.cover_image} alt="" className="h-full w-14 rounded object-cover" onError={e => { e.currentTarget.src = GAME_IMAGE_FALLBACK; }} />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{item.price === 0 ? 'Free' : `$${(item.price * (1 - item.discount_percent / 100)).toFixed(2)}`}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
