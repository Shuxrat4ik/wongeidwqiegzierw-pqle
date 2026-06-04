'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, Game, Review } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useParams, useRouter } from 'next/navigation';
import { Star, Download, ShoppingCart, Heart, Check, Calendar, Monitor, User, Building2, Tag, Play, Loader as Loader2, MessageSquare, Send, ChevronLeft, ChevronRight, Cpu, HardDrive, MemoryStick, Images, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { cn, formatDate, formatLongDate } from '@/lib/utils';
import { toast } from 'sonner';
import GameCard from '@/components/GameCard';
import { normalizeDbGameRow } from '@/lib/db';
import { GAME_IMAGE_FALLBACK, TOP_GAME_SEEDS, getTopGameBySlug, isSeedGameId } from '@/lib/top-games';
import { toYouTubeEmbedUrl } from '@/lib/media';
import { claimFreeGame, claimFreeGameAndDownload, startVerifiedDownload } from '@/lib/game-download-client';
import { isDatabaseGameId } from '@/lib/game-id';
import { addSeedToCollection, isSeedInCollection, openGameSite, readSeedCollection, toggleSeedWishlist } from '@/lib/game-collections';
import { getAffiliateUrl } from '@/lib/affiliate';

type MediaItem = {
  type: 'image' | 'video';
  src: string;
  label: string;
  thumb?: string | null;
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.map(value => value?.trim()).filter((value): value is string => Boolean(value)))];
}

function getYouTubeThumbnail(src: string) {
  try {
    const url = new URL(src);
    const host = url.hostname.replace(/^www\./, '');
    let id = '';

    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] ?? '';
    if (host.includes('youtube.com')) {
      id = url.searchParams.get('v') ?? '';
      const parts = url.pathname.split('/').filter(Boolean);
      if (!id && (parts[0] === 'embed' || parts[0] === 'shorts')) id = parts[1] ?? '';
    }

    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch {
    return null;
  }
}

function isDirectVideoUrl(src: string) {
  return /\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(src);
}

function getSteamAppId(src: string) {
  try {
    const url = new URL(src);
    if (!url.hostname.includes('steamstatic.com')) return null;
    const match = url.pathname.match(/\/steam\/apps\/(\d+)\//);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function steam4kCandidates(src: string) {
  const appId = getSteamAppId(src);
  if (!appId) return [src];

  const base = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}`;
  return [
    `${base}/library_hero.jpg`,
    `${base}/page_bg_generated_v6b.jpg`,
    `${base}/hero_capsule.jpg`,
    src,
  ];
}

function enhanceImageSrc(src: string) {
  try {
    const url = new URL(src);
    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      url.searchParams.set('w', '3840');
      url.searchParams.set('q', '95');
      return url.toString();
    }
  } catch {
    return src;
  }

  return src;
}

function buildMediaItems(game: Game): MediaItem[] {
  const videos = uniqueStrings([...(game.videos ?? []), game.trailer_url]).map((src, index) => ({
    type: 'video' as const,
    src,
    label: `Video ${index + 1}`,
    thumb: getYouTubeThumbnail(src),
  }));

  const images = uniqueStrings([
    ...(game.screenshots?.length ? game.screenshots : []),
    game.banner_image,
    game.cover_image,
  ].flatMap(steam4kCandidates)).map((src, index) => ({
    type: 'image' as const,
    src: enhanceImageSrc(src),
    label: `Screenshot ${index + 1}`,
  }));

  return [...images, ...videos];
}


export default function GameDetailPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const { user, userId, session } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [isOwned, setIsOwned] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedGames, setRelatedGames] = useState<Game[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [cartIds, setCartIds] = useState<Set<string>>(new Set());
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  

  const fetchGame = useCallback(async () => {
  let isMounted = true;

  try {
    setLoading(true);

    // 1. MAIN GAME (DB + fallback)
    const { data: dbGame, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (gameError) console.warn('[game fetch error]', gameError);

    const fallbackGame = getTopGameBySlug(slug);
    const merged = dbGame ?? fallbackGame;

    if (!merged) {
      if (isMounted) {
        setGame(null);
        setLoading(false);
      }
      return;
    }

    const g = normalizeDbGameRow(
      merged as unknown as Record<string, unknown>
    ) as Game;

    if (!isMounted) return;
    setGame(g);

    // 2. SEED GAME EARLY EXIT
    if (isSeedGameId(g.id)) {
      const related = TOP_GAME_SEEDS
        .filter(
          (item) =>
            item.id !== g.id &&
            item.genre.some((genre) => g.genre.includes(genre))
        )
        .slice(0, 4);

      setIsOwned(isSeedInCollection(userId, 'library', g.id));
      setIsWishlisted(isSeedInCollection(userId, 'wishlist', g.id));
      setIsInCart(false);

      setReviews([]);
      setRelatedGames(related);

      setOwnedIds(readSeedCollection(userId, 'library'));
      setWishlistIds(readSeedCollection(userId, 'wishlist'));
      setCartIds(new Set());

      setLoading(false);
      return;
    }

    // 3. RELATED + AUTH PREP
    const relatedPromise =
      (g.genre?.length ?? 0) > 0
        ? supabase
            .from('games')
            .select('*')
            .neq('id', g.id)
            .overlaps('genre', g.genre)
            .limit(4)
        : supabase
            .from('games')
            .select('*')
            .neq('id', g.id)
            .order('rating', { ascending: false })
            .limit(4);

    const token = session?.access_token;

    const ownershipPromise =
      user && token
        ? fetch(`/api/library/ownership?gameId=${encodeURIComponent(g.id)}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : { owned: false }))
            .catch(() => ({ owned: false }))
        : Promise.resolve({ owned: false });

    const authPromise =
      user && userId !== 'guest'
        ? Promise.all([
            supabase
              .from('wishlist')
              .select('id')
              .eq('user_id', userId)
              .eq('game_id', g.id)
              .maybeSingle(),

            supabase
              .from('cart')
              .select('id')
              .eq('user_id', userId)
              .eq('game_id', g.id)
              .maybeSingle(),

            supabase
              .from('wishlist')
              .select('game_id')
              .eq('user_id', userId),

            supabase
              .from('cart')
              .select('game_id')
              .eq('user_id', userId),
          ])
        : Promise.resolve([
            { data: null },
            { data: null },
            { data: [] },
            { data: [] },
          ] as any);

    // 4. PARALLEL FETCH
    const [reviewsRes, relatedRes, ownership, auth] = await Promise.all([
      supabase
        .from('reviews')
        .select('*, profiles(username)')
        .eq('game_id', g.id)
        .order('created_at', { ascending: false }),

      relatedPromise,
      ownershipPromise,
      authPromise,
    ]);

    const [wishCheck, cartCheck, wishAll, cartAll] = auth;

    const owned = Boolean((ownership as any)?.owned);

    if (!isMounted) return;

    // 5. STATE UPDATE (safe)
    setIsOwned(owned);
    setIsWishlisted(!!wishCheck?.data);
    setIsInCart(!!cartCheck?.data);

    setReviews((reviewsRes.data ?? []) as Review[]);

    setRelatedGames(
      (relatedRes.data ?? []).map((row) =>
        normalizeDbGameRow(row as Record<string, unknown>)
      ) as Game[]
    );

    setOwnedIds(new Set(owned ? [g.id] : []));
    setWishlistIds(new Set((wishAll.data ?? []).map((w: any) => w.game_id)));
    setCartIds(new Set((cartAll.data ?? []).map((c: any) => c.game_id)));

    setLoading(false);
  } catch (err) {
    console.error('[fetchGame error]', err);
    setGame(null);
    setLoading(false);
  }

  return () => {
    isMounted = false;
  };
}, [slug, user, userId, session?.access_token]);

  useEffect(() => {
    void fetchGame();
  }, [fetchGame]);

  useEffect(() => {
    const channel = supabase
      .channel(`game-detail-sync-${slug}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `slug=eq.${slug}` }, () => {
        void fetchGame();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGame, slug]);

  async function toggleWishlist() {
    if (!game) return;
    if (isSeedGameId(game.id)) {
      if (!user) {
        toast.error('Please sign in to use wishlist');
        return;
      }
      const added = toggleSeedWishlist(userId, game);
      setIsWishlisted(added);
      if (added) toast.success('Added to wishlist');
      else toast.info('Removed from wishlist');
      return;
    }
    if (!user) {
      toast.error('Please sign in to use wishlist');
      return;
    }
    if (!isDatabaseGameId(game.id)) {
      console.warn('[wishlist:add] blocked invalid gameId:', game.id);
      toast.error('This game is not available for wishlist yet');
      return;
    }
    setActionLoading('wish');
    if (isWishlisted) {
      const { error } = await supabase.from('wishlist').delete().eq('user_id', userId).eq('game_id', game.id);
      if (error) {
        toast.error(error.message);
        setActionLoading(null);
        return;
      }
      setIsWishlisted(false);
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
        setActionLoading(null);
        return;
      }
      if (!res.ok) {
        toast.error(typeof payload.error === 'string' ? payload.error : 'Failed to add to wishlist');
        setActionLoading(null);
        return;
      }
      setIsWishlisted(true);
      toast.success('Added to wishlist');
    }
    setActionLoading(null);
  }

  async function addToCart() {
    if (!game || isInCart || isOwned) return;
    if (game.price === 0) {
      await addToLibrary();
      return;
    }
    if (isSeedGameId(game.id)) {
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
    setActionLoading('cart');
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
      setActionLoading(null);
      return;
    }
    if (!res.ok) {
      toast.error(typeof payload.error === 'string' ? payload.error : 'Could not add to cart');
      setActionLoading(null);
      return;
    }
    setIsInCart(true);
    toast.success(`${game.title} added to cart`);
    setActionLoading(null);
  }

  async function buyNow() {
    if (!game || isOwned) return;

    const affiliateUrl = getAffiliateUrl(game);
    if (affiliateUrl) {
      window.location.href = affiliateUrl;
      return;
    }

    if (!user) {
      toast.error('Sign in to buy this game');
      return;
    }

    setActionLoading('buy');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ items: [{ gameId: game.id }] }),
      });

      const payload = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(payload?.error || 'Checkout failed');
      if (!payload?.url) throw new Error('No affiliate URL configured');

      window.location.href = payload.url;
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function addToLibrary() {
    if (!game || isOwned) return;
    if (isSeedGameId(game.id)) {
      if (!user) {
        toast.error('Sign in to add games to your library');
        return;
      }
      addSeedToCollection(userId, 'library', game);
      setIsOwned(true);
      toast.success(`${game.title} added to your library`);
      return;
    }
    if (!user) {
      toast.error('Sign in to add games to your library');
      return;
    }
    if (game.price > 0) {
      toast.error('Paid games must be purchased first');
      return;
    }
    setActionLoading('lib');
    const claimed = await claimFreeGame(supabase, { gameId: game.id, slug: game.slug });
    if (!claimed) {
      setActionLoading(null);
      return;
    }
    setIsOwned(true);
    setIsInCart(false);
    toast.success(`${game.title} added to your library`);
    setActionLoading(null);
  }

  function downloadSeedGame() {
    if (!game) return;
    if (user) {
      addSeedToCollection(userId, 'library', game);
      setIsOwned(true);
      toast.success(`${game.title} added to your library`);
    } else {
      toast.info('Sign in to save this game to your library');
    }
    openGameSite(game);
  }

  async function submitReview() {
    if (!game || !user) return;
    if (isSeedGameId(game.id)) {
      toast.info('Install this seeded game into Supabase to enable reviews.');
      return;
    }
    if (!reviewTitle.trim() || !reviewContent.trim()) {
      toast.error('Please fill in all review fields');
      return;
    }
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      user_id: user.id,
      game_id: game.id,
      rating: reviewRating,
      title: reviewTitle,
      content: reviewContent,
    });
    if (error) {
      toast.error(error.message.includes('unique') ? 'You already reviewed this game' : 'Failed to submit review');
    } else {
      toast.success('Review submitted!');
      setReviewTitle('');
      setReviewContent('');
      setReviewRating(5);
      const res = await supabase.from('reviews').select('*, profiles(username)').eq('game_id', game.id).order('created_at', { ascending: false });
      setReviews((res.data ?? []) as Review[]);
    }
    setSubmittingReview(false);
  }

  function nextScreenshot() {
    if (!game) return;
    const items = buildMediaItems(game);
    if (items.length === 0) return;
    setActiveScreenshot((activeScreenshot + 1) % items.length);
  }

  function prevScreenshot() {
    if (!game) return;
    const items = buildMediaItems(game);
    if (items.length === 0) return;
    setActiveScreenshot((activeScreenshot - 1 + items.length) % items.length);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Game not found</h1>
        <Link href="/" className="text-sky-400 hover:text-sky-300">Back to Store</Link>
      </div>
    );
  }

  const isFree = game.price === 0;
  const isSeed = isSeedGameId(game.id);
  const hasDiscount = game.discount_percent > 0;
  const discountedPrice = game.price * (1 - game.discount_percent / 100);
  const stars = Math.round(game.rating);
  const sysReq = game.system_requirements as any;
  const mediaItems = buildMediaItems(game);
  const activeMedia = mediaItems[Math.min(activeScreenshot, Math.max(mediaItems.length - 1, 0))];
  const imageCount = mediaItems.filter(item => item.type === 'image').length;
  const videoCount = mediaItems.filter(item => item.type === 'video').length;
  const avgReviewRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="min-h-screen">
      <div className="relative h-[50px] md:h-[150px] object-cover overflow-hidden">
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto -mt-20 max-w-[1240px] px-4 pb-20 sm:px-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,740px)_340px] xl:items-start xl:justify-center xl:gap-8">
          <div className="min-w-0 space-y-6">
            {/* Title */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {isFree && <span className="badge-free text-white text-xs font-bold px-2.5 py-1 rounded-md">FREE</span>}
                {hasDiscount && <span className="badge-discount text-white text-xs font-bold px-2.5 py-1 rounded-md">-{game.discount_percent}%</span>}
                {isOwned && <span className="badge-owned text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1"><Check className="w-3 h-3" /> Owned</span>}
                {(game.genre ?? []).map(g => <span key={g} className="text-xs bg-white/10 text-[#9e9e9e] px-2.5 py-1 rounded-md">{g}</span>)}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{game.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#9e9e9e]">
                <div className="flex shrink-0 items-center gap-1.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className={cn('w-4 h-4', i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600')} />)}
                  <span className="ml-1">{game.rating.toFixed(1)}</span>
                </div>
                <span className="hidden sm:inline">·</span>
                <span>{game.review_count.toString()} reviews</span>
              </div>
            </div>

            {/* Media Hub */}
            <section className="w-full overflow-hidden rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.28)]">
              {/* <div className="flex flex-col gap-2 border-b border-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#0078f4]/20 bg-[#0078f4]/5">
                    <Images className="h-4 w-4 text-[#0078f4]" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-black text-white">Media Hub</h2>
                    <p className="truncate text-xs text-[#9e9e9e]">
                      {imageCount} screenshots · {videoCount} videos
                    </p>
                  </div>
                </div>
              </div> */}

              <div className="p-3">
                <div className="group relative aspect-video overflow-hidden rounded-lg bg-black object-cover">
                  {activeMedia?.type === 'video' ? (
                    toYouTubeEmbedUrl(activeMedia.src) ? (
                      <iframe
                        src={toYouTubeEmbedUrl(activeMedia.src) ?? ''}
                        className="h-full w-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={`${game.title} video`}
                      />
                    ) : isDirectVideoUrl(activeMedia.src) ? (
                      <video src={activeMedia.src} controls className="h-full w-full bg-black object-contain" />
                    ) : (
                      <iframe
                        src={activeMedia.src}
                        className="h-full w-full"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={`${game.title} video`}
                      />
                    )
                  ) : (
                    <img
                      src={activeMedia?.src ?? game.banner_image}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      decoding="async"
                      onError={e => { e.currentTarget.src = enhanceImageSrc(GAME_IMAGE_FALLBACK); }}
                    />
                  )}
                  {mediaItems.length > 1 && (
                    <>
                      {/* <button type="button" onClick={prevScreenshot} className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white/80 backdrop-blur transition hover:bg-black/75 hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                      </button> */}
                      {/* <button type="button" onClick={nextScreenshot} className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white/80 backdrop-blur transition hover:bg-black/75 hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                      </button> */}
                      {/* <div className="absolute bottom-2 right-2 z-20 rounded-md border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white/80 backdrop-blur">
                        {Math.min(activeScreenshot + 1, mediaItems.length)} / {mediaItems.length}
                      </div> */}
                    </>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {mediaItems.length > 3 && (
                    <button type="button" onClick={prevScreenshot} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/15 hover:text-white sm:flex">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
                    {mediaItems.map((item, i) => {
                      const selected = activeScreenshot === i;
                      return (
                      <button
                        type="button"
                        key={`${item.type}-${item.src}-${i}`}
                        onClick={() => setActiveScreenshot(i)}
                        className={cn(
                          'relative h-14 w-24 shrink-0 overflow-hidden rounded-md border bg-black transition sm:h-16 sm:w-28',
                          selected ? 'border-white ring-1 ring-white/70' : 'border-white/10 hover:border-white/35'
                        )}
                      >
                        {item.type === 'image' ? (
                          <img
                            src={item.src}
                            alt=""
                            className="h-full w-full object-cover object-center"
                            decoding="async"
                            onError={e => { e.currentTarget.src = enhanceImageSrc(GAME_IMAGE_FALLBACK); }}
                          />
                        ) : item.thumb ? (
                          <img
                            src={item.thumb}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-full w-full bg-black" />
                        )}
                        {item.type === 'video' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
                              <Play className="ml-0.5 h-4 w-4 fill-current" />
                            </span>
                          </div>
                        )}
                        <span className="sr-only">{item.label}</span>
                      </button>
                    );
                    })}
                  </div>
                  {mediaItems.length > 3 && (
                    <button type="button" onClick={nextScreenshot} className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/15 hover:text-white sm:flex">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Description */}
            <div className="max-w-[720px]">
              <h2 className="text-lg font-bold text-white mb-3 section-header">About This Game</h2>
              <p className="text-[#f5f5f5] leading-relaxed whitespace-pre-line">{game.description}</p>
            </div>

            {/* System Requirements */}
            {sysReq && (sysReq.minimum || sysReq.recommended) && (
              <div className="max-w-[720px]">
                <h2 className="text-lg font-bold text-white mb-4 section-header">System Requirements</h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {sysReq.minimum && (
                    <div className="rounded-lg border border-white/10 bg-[#080a12] p-4">
                      <h3 className="text-sm font-bold text-[#9e9e9e] mb-3">Minimum</h3>
                      <div className="space-y-2.5">
                        <ReqRow icon={<Monitor className="w-4 h-4 text-[#0078f4]" />} label="OS" value={sysReq.minimum.os} />
                        <ReqRow icon={<Cpu className="w-4 h-4 text-[#0078f4]" />} label="CPU" value={sysReq.minimum.cpu} />
                        <ReqRow icon={<MemoryStick className="w-4 h-4 text-[#0078f4]" />} label="RAM" value={sysReq.minimum.ram} />
                        <ReqRow icon={<Monitor className="w-4 h-4 text-[#0078f4]" />} label="GPU" value={sysReq.minimum.gpu} />
                        <ReqRow icon={<HardDrive className="w-4 h-4 text-[#0078f4]" />} label="Storage" value={sysReq.minimum.storage} />
                      </div>
                    </div>
                  )}
                  {sysReq.recommended && (
                    <div className="rounded-lg border border-white/10 bg-[#080a12] p-4">
                      <h3 className="text-sm font-bold text-[#0078f4] mb-3">Recommended</h3>
                      <div className="space-y-2.5">
                        <ReqRow icon={<Monitor className="w-4 h-4 text-[#0078f4]" />} label="OS" value={sysReq.recommended.os} />
                        <ReqRow icon={<Cpu className="w-4 h-4 text-[#0078f4]" />} label="CPU" value={sysReq.recommended.cpu} />
                        <ReqRow icon={<MemoryStick className="w-4 h-4 text-[#0078f4]" />} label="RAM" value={sysReq.recommended.ram} />
                        <ReqRow icon={<Monitor className="w-4 h-4 text-[#0078f4]" />} label="GPU" value={sysReq.recommended.gpu} />
                        <ReqRow icon={<HardDrive className="w-4 h-4 text-[#0078f4]" />} label="Storage" value={sysReq.recommended.storage} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="max-w-[720px]">
              <h2 className="text-lg font-bold text-white mb-3 section-header">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {game.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-[#f5f5f5] transition-colors hover:bg-white/10 cursor-default">
                    <Tag className="w-3 h-3 text-[#0078f4]" />{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="max-w-[720px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white section-header">
                  <MessageSquare className="w-5 h-5 text-sky-400 inline mr-2" />
                  Reviews {avgReviewRating && <span className="text-slate-400 font-normal text-sm">({avgReviewRating} avg)</span>}
                </h2>
              </div>

              {/* Write review */}
              {user && !isOwned && game.price > 0 && (
                <p className="text-slate-500 text-sm mb-4">Purchase this game to leave a review.</p>
              )}
              {user && (isOwned || isFree) && (
                <div className="bg-[#080a12] rounded-xl border border-white/5 p-4 mb-4">
                  <h3 className="text-sm font-bold text-white mb-3">Write a Review</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-slate-400">Rating:</span>
                    {[1,2,3,4,5].map(i => (
                      <button key={i} onClick={() => setReviewRating(i)}>
                        <Star className={cn('w-5 h-5 cursor-pointer transition-colors', i <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-amber-400/50')} />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Review title..."
                    value={reviewTitle}
                    onChange={e => setReviewTitle(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 mb-2"
                  />
                  <textarea
                    placeholder="Share your thoughts..."
                    value={reviewContent}
                    onChange={e => setReviewContent(e.target.value)}
                    rows={3}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 mb-3 resize-none"
                  />
                  <button
                    onClick={submitReview}
                    disabled={submittingReview}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Review
                  </button>
                </div>
              )}
              {!user && (
                <div className="bg-[#080a12] rounded-xl border border-white/5 p-4 mb-4 text-center">
                  <p className="text-slate-400 text-sm mb-2">Sign in to write a review</p>
                  <Link href="/auth" className="text-sky-400 hover:text-sky-300 text-sm font-medium">Sign In →</Link>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 ? (
                <p className="text-slate-500 text-sm">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <div key={review.id} className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                            {(review.profiles?.username || 'U')[0].toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{review.profiles?.username || 'User'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => <Star key={i} className={cn('w-3.5 h-3.5', i <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600')} />)}
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-1">{review.title}</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{review.content}</p>
                      <p className="text-xs text-slate-600 mt-2">{formatDate(review.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Games */}
            {relatedGames.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 section-header">You Might Also Like</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {relatedGames.map((g, index) => (
                    <GameCard
                      key={`${g.id}-${g.slug}-${index}`}
                      game={{
                        id: g.id,
                        slug: g.slug,
                        title: g.title,
                        developer: g.developer,
                        coverImage: g.cover_image,
                        price: g.price,
                        discount: g.discount_percent,
                        rating: g.rating,
                        isOwned: ownedIds.has(g.id),
                      }}
	                      isWishlisted={wishlistIds.has(g.id)}
	                      onAddToCart={async (gid) => {
	                        const row = relatedGames.find((x) => x.id === gid);
	                        if (row && isSeedGameId(gid)) {
	                          openGameSite(row);
	                          return;
	                        }
		                        if (!user) {
		                          toast.error('Sign in to add games to your cart');
		                          return;
		                        }
                        if (!isDatabaseGameId(gid)) {
                          console.warn('[cart:add] blocked invalid gameId:', gid);
                          toast.error('This game is not available for cart yet');
                          return;
                        }
		                        if (cartIds.has(gid)) {
	                          toast.info('Already in cart');
	                          return;
	                        }
                        const res = await fetch('/api/cart/add', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session?.access_token ?? ''}`,
                          },
                          body: JSON.stringify({ gameId: gid }),
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
                        setCartIds((prev) => new Set(prev).add(gid));
                        toast.success('Added to cart');
	                      }}
	                      onAddToWishlist={async (gid) => {
		                        if (!user) {
		                          toast.error('Please sign in to use wishlist');
		                          return;
		                        }
	                        const row = relatedGames.find((x) => x.id === gid);
	                        if (row && isSeedGameId(gid)) {
	                          const added = toggleSeedWishlist(userId, row);
	                          setWishlistIds((prev) => {
	                            const next = new Set(prev);
	                            if (added) next.add(gid);
	                            else next.delete(gid);
	                            return next;
	                          });
	                          if (added) toast.success('Added to wishlist');
	                          else toast.info('Removed from wishlist');
		                          return;
		                        }
                        if (!isDatabaseGameId(gid)) {
                          console.warn('[wishlist:add] blocked invalid gameId:', gid);
                          toast.error('This game is not available for wishlist yet');
                          return;
                        }
		                        if (wishlistIds.has(gid)) {
                          const { error } = await supabase.from('wishlist').delete().eq('user_id', userId).eq('game_id', gid);
                          if (error) {
                            toast.error(error.message);
                            return;
                          }
                          setWishlistIds((prev) => {
                            const n = new Set(prev);
                            n.delete(gid);
                            return n;
                          });
                          toast.info('Removed from wishlist');
                          return;
                        }
                        const res = await fetch('/api/wishlist/add', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session?.access_token ?? ''}`,
                          },
                          body: JSON.stringify({ gameId: gid }),
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
                        setWishlistIds((prev) => new Set(prev).add(gid));
                        toast.success('Added to wishlist');
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-4 mt-40">
            <div className="flex flex-col gap-4 rounded-lg p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <img
                src={game.banner_image || game.cover_image}
                alt={game.title}
                className="w-full min-h-[300px] aspect-video rounded-lg object-cover"
                decoding="async"
                onError={e => { e.currentTarget.src = enhanceImageSrc(GAME_IMAGE_FALLBACK); }}
              />
              <div>
                {isFree ? (
                  <div className="text-xl font-black text-sky-400">FREE</div>
                ) : (
                  <div className="flex items-end gap-2">
                    {hasDiscount && <span className="text-slate-500 line-through text-sm">${game.price.toFixed(2)}</span>}
                    <span className="text-xl font-black text-white">${discountedPrice.toFixed(2)}</span>
                    {hasDiscount && <span className="badge-discount text-white text-xs font-bold px-2 py-0.5 rounded-md ml-1">-{game.discount_percent}%</span>}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {isOwned ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isSeed) downloadSeedGame();
                      else void startVerifiedDownload(supabase, game.slug);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400"
                  >
                    <Download className="w-4 h-4" /> Play / Download
                  </button>
                ) : isFree ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSeed) downloadSeedGame();
                        else void claimFreeGameAndDownload(supabase, { gameId: game.id, slug: game.slug }).then((ok) => {
                          if (ok) setIsOwned(true);
                        });
                      }}
                      disabled={actionLoading === 'lib'}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400"
                    >
                      {actionLoading === 'lib' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download Free
                    </button>
                    <button onClick={addToLibrary} disabled={actionLoading === 'lib'} className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15">
                      {actionLoading === 'lib' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Add to Library
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={buyNow} disabled={actionLoading === 'buy'} className="w-full flex items-center justify-center gap-2 rounded-lg bg-sky-500 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition-colors hover:bg-sky-400 disabled:opacity-60">
                      {actionLoading === 'buy' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />} Buy Now
                    </button>
                    <button onClick={addToCart} disabled={isInCart || actionLoading === 'cart'} className={cn('w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors', isInCart ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default' : 'bg-white/10 hover:bg-white/15 text-white')}>
                      {actionLoading === 'cart' ? <Loader2 className="w-4 h-4 animate-spin" /> : isInCart ? <><Check className="w-4 h-4" /> In Cart</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
                    </button>
                    {isInCart && <Link href="/cart" className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15">View Cart</Link>}
                  </>
                )}
                <button onClick={toggleWishlist} disabled={actionLoading === 'wish'} className={cn('w-full flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors', isWishlisted ? 'bg-sky-500/15 border-sky-500/40 text-sky-400' : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20 hover:text-white')}>
                  {actionLoading === 'wish' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current text-sky-400')} />}
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>
              </div>
            </div>

            <div className="rounded-lg p-4 shadow-[0_20px_60px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              <h3 className="font-bold text-white text-sm">Game Details</h3>
              <div className="mt-2 flex flex-col divide-y divide-white/10 text-sm">
                <InfoRow icon={<User className="w-4 h-4 text-sky-400" />} label="Developer" value={game.developer} />
                <InfoRow icon={<Building2 className="w-4 h-4 text-sky-400" />} label="Publisher" value={game.publisher} />
                <InfoRow icon={<Calendar className="w-4 h-4 text-sky-400" />} label="Release Date" value={formatLongDate(game.release_date)} />
                <InfoRow icon={<Monitor className="w-4 h-4 text-sky-400" />} label="Platform" value={(game.platform ?? []).join(', ')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-2 text-slate-400">
        <div className="shrink-0">{icon}</div>
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <div className="min-w-0 max-w-[58%] truncate text-right font-medium text-white">{value}</div>
    </div>
  );
}

function ReqRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <div className="text-slate-500 text-xs">{label}</div>
        <div className="text-white text-sm">{value}</div>
      </div>
    </div>
  );
}
