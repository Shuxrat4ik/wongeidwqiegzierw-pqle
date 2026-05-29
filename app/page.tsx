'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Eye,
  Film,
  Gamepad2,
  Ghost,
  Globe2,
  Heart,
  Play,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchFeaturedGames, fetchGames, normalizeDbGameRow, type FeaturedGame, type Game } from '@/lib/db';
import { TOP_GAME_SEEDS } from '@/lib/top-games';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1400&q=80';

const creatorNames = ['VoidByte', 'NeonValkyrie', 'PulseGGz', 'GhostRunner'];
const fallbackGames = TOP_GAME_SEEDS.slice(0, 48) as unknown as Game[];

function toFeaturedGames(rows: FeaturedGame[]): Game[] {
  return rows.map((row) => row.games).filter((game): game is Game => Boolean(game));
}

function uniqueGames(games: Game[]) {
  const seen = new Set<string>();
  return games.filter((game) => {
    if (seen.has(game.id)) return false;
    seen.add(game.id);
    return true;
  });
}

function imageFor(game?: Game) {
  return game?.banner_image || game?.cover_image || game?.screenshots?.[0] || FALLBACK_IMAGE;
}

function coverFor(game?: Game) {
  return game?.cover_image || game?.banner_image || game?.screenshots?.[0] || FALLBACK_IMAGE;
}

function priceFor(game: Game) {
  if (game.price === 0) return 'Free';
  const discount = Math.max(0, Math.min(95, game.discount_percent || 0));
  const price = discount > 0 ? game.price * (1 - discount / 100) : game.price;
  return '$' + Math.max(price, 0).toFixed(2);
}

function genreFor(game?: Game) {
  return game?.genre?.[0] || 'Action';
}

function reviewLabel(count?: number) {
  const value = Number(count || 0);
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M reviews';
  if (value >= 1000) return Math.round(value / 1000) + 'k reviews';
  return Math.max(value, 240).toLocaleString() + ' reviews';
}

function wishlistFor(list: Game[], isWishlisted: (gameId: string) => boolean) {
  return new Set(list.filter((game) => isWishlisted(game.id)).map((game) => game.id));
}

function DiscoverHomeContent() {
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [trendingFeatured, setTrendingFeatured] = useState<FeaturedGame[]>([]);
  const [newReleaseFeatured, setNewReleaseFeatured] = useState<FeaturedGame[]>([]);
  const [saleFeatured, setSaleFeatured] = useState<FeaturedGame[]>([]);
  const [newestGames, setNewestGames] = useState<Game[]>([]);
  const [saleGames, setSaleGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHomepage = useCallback(async () => {
    setLoading(true);
    try {
      const [trending, editorialNewReleases, editorialSales, newest, saleRes] = await Promise.all([
        fetchFeaturedGames(supabase, 'trending'),
        fetchFeaturedGames(supabase, 'new_release'),
        fetchFeaturedGames(supabase, 'on_sale'),
        fetchGames(supabase, { limit: 36, sortBy: 'newest' }),
        supabase
          .from('games')
          .select('*')
          .gt('discount_percent', 0)
          .order('discount_percent', { ascending: false })
          .limit(24),
      ]);

      setTrendingFeatured(trending);
      setNewReleaseFeatured(editorialNewReleases);
      setSaleFeatured(editorialSales);
      setNewestGames((newest as { games?: Game[] })?.games ?? []);

      if (saleRes.data) {
        setSaleGames(
          saleRes.data.map((row) => normalizeDbGameRow(row as unknown as Record<string, unknown>) as Game)
        );
      }
    } catch (error) {
      console.error('Failed to load Discover homepage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHomepage();
  }, [loadHomepage]);

  const lists = useMemo(() => {
    const newestPool = newestGames.length > 0 ? newestGames : fallbackGames;
    const salePool = saleGames.length > 0 ? saleGames : fallbackGames.filter((game) => game.discount_percent > 0);
    const trending = uniqueGames(
      toFeaturedGames(trendingFeatured).length > 0 ? toFeaturedGames(trendingFeatured) : newestPool
    ).slice(0, 12);
    const releases = uniqueGames(
      toFeaturedGames(newReleaseFeatured).length > 0 ? toFeaturedGames(newReleaseFeatured) : newestPool
    ).slice(0, 12);
    const deals = uniqueGames(
      toFeaturedGames(saleFeatured).length > 0 ? toFeaturedGames(saleFeatured) : salePool
    ).slice(0, 12);
    const combined = uniqueGames([...trending, ...releases, ...deals, ...newestPool]);
    const topSellers = [...combined].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);

    return {
      trending,
      releases,
      deals,
      topSellers,
      categories: combined.slice(0, 8),
      creators: combined.slice(0, 4),
      spotlight: trending[0] || releases[0] || deals[0] || newestPool[0],
    };
  }, [newReleaseFeatured, newestGames, saleFeatured, saleGames, trendingFeatured]);

  const spotlight = lists.spotlight;
  const wishlistedTrending = wishlistFor(lists.trending, isWishlisted);

  return (
    <div className="nexus-discover min-h-screen overflow-x-hidden bg-[#080a12] text-white">
      {spotlight ? (
        <DiscoverHero game={spotlight} onAddToCart={addToCart} isWishlisted={isWishlisted(spotlight.id)} onWishlist={toggleWishlist} />
      ) : (
        <DiscoverFallbackHero loading={loading} />
      )}

      <DiscoverMarquee games={uniqueGames([...lists.trending, ...lists.releases, ...lists.deals]).slice(0, 8)} />

      <TrendingRail
        title="Hot Right Now"
        eyebrow="Trending Worldwide"
        subtitle="The games dominating wishlists, carts, and player feeds."
        games={lists.trending}
        loading={loading}
        onAddToCart={addToCart}
        onWishlist={toggleWishlist}
        wishlisted={wishlistedTrending}
      />

      <CategoryUniverse games={lists.categories} />
      <NewReleaseWall games={lists.releases} loading={loading} />
      <TopSellerBoard games={lists.topSellers} loading={loading} />
      <NexusPass deals={lists.deals} />
      <LiveEvents games={lists.topSellers} />
      <CreatorGrid games={lists.creators} />
      <CatalogCallout />
    </div>
  );
}

function DiscoverHero({
  game,
  onAddToCart,
  onWishlist,
  isWishlisted,
}: {
  game: Game;
  onAddToCart: (gameId: string) => void;
  onWishlist: (gameId: string) => void;
  isWishlisted: boolean;
}) {
  return (
    <section className="nexus-hero relative min-h-[calc(100svh-44px)] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.04, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        <img src={imageFor(game)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a12_0%,rgba(8,10,18,.92)_32%,rgba(8,10,18,.56)_68%,rgba(8,10,18,.28)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#080a12_0%,rgba(8,10,18,.25)_48%,rgba(8,10,18,.65)_100%)]" />
        <div className="nexus-grid absolute inset-0" />
      </motion.div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="nexus-glow nexus-glow-blue left-[-12rem] top-[14%]" />
        <div className="nexus-glow nexus-glow-violet bottom-[10%] right-[-10rem]" />
        <div className="nexus-scan-line" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-44px)] max-w-[1680px] items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="nexus-pill mb-6">
            <span className="nexus-live-dot" />
            Featured Discover Drop
          </div>

          <h1 className="nexus-hero-title">{game.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#c8d1e7] sm:text-lg">
            {game.short_description || game.description || 'Discover a polished PC game with trailers, screenshots, and store-ready details.'}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-semibold text-[#dce7ff]">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-[#67e8f9] text-[#67e8f9]" />
              {Number(game.rating || 4.8).toFixed(1)}
              <span className="text-[#8c98b6]">{reviewLabel(game.review_count)}</span>
            </span>
            <span>{genreFor(game)}</span>
            <span>{priceFor(game)}</span>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => onAddToCart(game.id)} className="nexus-btn-primary">
              <ShoppingCart className="h-4 w-4" />
              Add to cart
            </button>
            <Link href={'/games/' + game.slug + '#trailer'} className="nexus-btn-secondary">
              <Film className="h-4 w-4" />
              Watch trailer
            </Link>
            <button
              type="button"
              onClick={() => onWishlist(game.id)}
              className="nexus-icon-btn"
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={isWishlisted ? 'h-5 w-5 fill-[#ff4f9a] text-[#ff4f9a]' : 'h-5 w-5'} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className="nexus-hero-card hidden lg:block"
        >
          <Link href={'/games/' + game.slug} className="block overflow-hidden rounded-[18px]">
            <img src={coverFor(game)} alt={game.title} className="aspect-[3/4] w-full object-cover" />
          </Link>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ['Rating', Number(game.rating || 4.8).toFixed(1)],
              ['Genre', genreFor(game)],
              ['Price', priceFor(game)],
            ].map(([label, value]) => (
              <div key={label} className="nexus-mini-stat">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DiscoverFallbackHero({ loading }: { loading: boolean }) {
  return (
    <section className="nexus-hero relative min-h-[calc(100svh-44px)] overflow-hidden">
      <div className="absolute inset-0">
        <img src={FALLBACK_IMAGE} alt="" className="h-full w-full object-cover opacity-28" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#080a12_0%,rgba(8,10,18,.9)_42%,rgba(8,10,18,.55)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#080a12_0%,rgba(8,10,18,.2)_52%,rgba(8,10,18,.7)_100%)]" />
        <div className="nexus-grid absolute inset-0" />
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="nexus-glow nexus-glow-blue left-[-12rem] top-[14%]" />
        <div className="nexus-glow nexus-glow-violet bottom-[10%] right-[-10rem]" />
        <div className="nexus-scan-line" />
      </div>
      <div className="relative mx-auto flex min-h-[calc(100svh-44px)] max-w-[1680px] items-center px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="nexus-pill mb-6">
            <span className="nexus-live-dot" />
            {loading ? 'Loading Project Games' : 'Project Catalog Ready'}
          </div>
          <h1 className="nexus-hero-title">NexusVault Discover</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#c8d1e7] sm:text-lg">
            Explore trending titles, categories, new releases, top sellers, deals, events, and creator picks from the Project game store.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/games" className="nexus-btn-primary">
              <ShoppingCart className="h-4 w-4" />
              Browse games
            </Link>
            <Link href="/wishlist" className="nexus-btn-secondary">
              <Heart className="h-4 w-4" />
              Wishlist
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DiscoverMarquee({ games }: { games: Game[] }) {
  const labels = games.length
    ? games.map((game) => game.title + ' · ' + (game.discount_percent > 0 ? '-' + game.discount_percent + '%' : priceFor(game)))
    : ['NEXUSVAULT · DISCOVER', 'TOP PC GAMES · LIVE', 'WISHLIST DROPS · READY'];
  const row = [...labels, ...labels];

  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-white/[0.035]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#080a12] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#080a12] to-transparent" />
      <div className="nexus-marquee flex gap-12 py-4">
        {row.map((item, index) => (
          <span key={item + '-' + index} className="inline-flex shrink-0 items-center gap-4 text-xs font-black uppercase text-[#94a3b8]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#67e8f9] shadow-[0_0_12px_currentColor]" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-5">
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-[#2f8cff] to-[#b56cff]" />
          <span className="text-[11px] font-bold uppercase text-[#67e8f9]">{eyebrow}</span>
        </div>
        <h2 className="text-3xl font-black text-white sm:text-4xl lg:text-5xl">{title}</h2>
        {subtitle ? <p className="mt-2 max-w-xl text-sm leading-6 text-[#96a3bd] sm:text-base">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function TrendingRail({
  eyebrow,
  title,
  subtitle,
  games,
  loading,
  onAddToCart,
  onWishlist,
  wishlisted,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  games: Game[];
  loading: boolean;
  onAddToCart: (gameId: string) => void;
  onWishlist: (gameId: string) => void;
  wishlisted: Set<string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.82, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="flex items-end justify-between gap-4">
        <SectionHeader eyebrow={eyebrow} title={title} subtitle={subtitle} />
        <div className="mb-8 hidden shrink-0 items-center gap-2 sm:flex">
          <button type="button" onClick={() => scroll(-1)} className="nexus-arrow-btn" aria-label="Scroll left">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => scroll(1)} className="nexus-arrow-btn" aria-label="Scroll right">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex snap-x gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading && games.length === 0
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[420px] w-[280px] shrink-0 rounded-2xl bg-white/[0.06]" />)
          : games.map((game, index) => (
              <motion.article
                key={game.id + '-' + index}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.45, delay: index * 0.04 }}
                className="nexus-game-card group w-[260px] shrink-0 snap-start overflow-hidden rounded-2xl"
              >
                <Link href={'/games/' + game.slug} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img src={coverFor(game)} alt={game.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1020] via-[#0b1020]/28 to-transparent" />
                    {game.discount_percent > 0 ? <div className="nexus-discount-badge">-{game.discount_percent}%</div> : null}
                    <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-xs font-bold backdrop-blur">
                      <Star className="h-3.5 w-3.5 fill-[#67e8f9] text-[#67e8f9]" />
                      {Number(game.rating || 4.8).toFixed(1)}
                    </div>
                  </div>
                </Link>
                <div className="p-5">
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {(game.genre || []).slice(0, 2).map((tag) => (
                      <span key={tag} className="nexus-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link href={'/games/' + game.slug} className="block">
                    <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-7 text-white group-hover:text-[#67e8f9]">{game.title}</h3>
                  </Link>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      {game.discount_percent > 0 ? <div className="text-xs text-[#7d8aa5] line-through">{'$' + game.price.toFixed(2)}</div> : null}
                      <div className="text-xl font-black text-[#67e8f9]">{priceFor(game)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => onWishlist(game.id)} className="nexus-card-icon" aria-label="Wishlist">
                        <Heart className={wishlisted.has(game.id) ? 'h-4 w-4 fill-[#ff4f9a] text-[#ff4f9a]' : 'h-4 w-4'} />
                      </button>
                      <button type="button" onClick={() => onAddToCart(game.id)} className="nexus-card-add">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
      </div>
    </section>
  );
}

function CategoryUniverse({ games }: { games: Game[] }) {
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    games.forEach((game) => (game.genre || []).slice(0, 2).forEach((genre) => counts.set(genre, (counts.get(genre) || 0) + 1)));
    const fallback = ['Shooter', 'Open World', 'RPG', 'Horror', 'Racing', 'Multiplayer', 'Strategy', 'Indie'];
    const names = Array.from(counts.keys()).concat(fallback).filter((name, index, list) => list.indexOf(name) === index).slice(0, 8);
    const icons = [Crosshair, Globe2, Gamepad2, Ghost, Car, Users, Trophy, Sparkles];
    return names.map((name, index) => ({ name, count: counts.get(name) || Math.max(120, 900 - index * 87), Icon: icons[index % icons.length] }));
  }, [games]);

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader eyebrow="Browse Universes" title="Popular Categories" subtitle="Find your next obsession across the Project catalog." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map(({ name, count, Icon }, index) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.04 }}
          >
            <Link href={'/games?genre=' + encodeURIComponent(name)} className="nexus-category-card group">
              <span className="nexus-category-icon">
                <Icon className="h-5 w-5" />
              </span>
              <span className="mt-auto block text-2xl font-black uppercase text-white">{name}</span>
              <span className="mt-1 block text-xs font-bold uppercase text-[#93a2bd]">{count.toLocaleString()} games</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function NewReleaseWall({ games, loading }: { games: Game[]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader eyebrow="Just Dropped" title="New Releases" subtitle="Fresh worlds added to the store recently." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {loading && games.length === 0
          ? Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[3/4] rounded-xl bg-white/[0.06]" />)
          : games.slice(0, 6).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Link href={'/games/' + game.slug} className="nexus-release-card group">
                  <img src={coverFor(game)} alt={game.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080a12] via-[#080a12]/26 to-transparent" />
                  <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                    <span className="nexus-live-badge"><span />Live</span>
                    {game.discount_percent > 0 ? <span className="nexus-cyan-badge">-{game.discount_percent}%</span> : null}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="mb-1 text-[10px] font-black uppercase text-[#67e8f9]">{game.release_date ? new Date(game.release_date).getFullYear() : 'Out now'}</div>
                    <div className="line-clamp-2 text-sm font-bold leading-5 text-white">{game.title}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
}

function TopSellerBoard({ games, loading }: { games: Game[]; loading: boolean }) {
  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader eyebrow="Leaderboard" title="Top Sellers" subtitle="Highly rated Project titles players keep coming back to." />
      <div className="space-y-3">
        {loading && games.length === 0
          ? Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-28 rounded-2xl bg-white/[0.06]" />)
          : games.slice(0, 5).map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <Link href={'/games/' + game.slug} className="nexus-seller-row group">
                  <div className="w-14 shrink-0 text-center text-4xl font-black text-transparent sm:w-20 sm:text-6xl">
                    <span className="nexus-gradient-text">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-32">
                    <img src={coverFor(game)} alt={game.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-bold text-white sm:text-xl">{game.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#96a3bd]">
                      <span className="inline-flex items-center gap-1.5"><Users className="h-3 w-3" />{reviewLabel(game.review_count)}</span>
                      <span className="inline-flex items-center gap-1.5 text-[#67e8f9]"><Star className="h-3 w-3" />Rating {Number(game.rating || 4.8).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-base font-black text-[#67e8f9] sm:text-2xl">{priceFor(game)}</div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
}

function NexusPass({ deals }: { deals: Game[] }) {
  const perks = [
    'Premium catalog picks in one place',
    'Wishlist and cart flow stays connected',
    'Trailers, screenshots, reviews, and discounts',
    'Fast access to library-ready game pages',
    'Curated drops from Project games',
    'Member-style discovery rails',
  ];
  const deal = deals[0];

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="nexus-pass relative overflow-hidden rounded-3xl p-8 sm:p-10 lg:p-16">
        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="nexus-pill mb-6"><Zap className="h-3.5 w-3.5" /> NexusVault Pass</div>
            <h2 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Play <span className="nexus-gradient-text">more.</span><br />Build one library.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#aebbd4]">
              A Discover section shaped around your real Project catalog, with the Nexus visual system adapted for this store.
            </p>
            <div className="mt-8 flex items-end gap-3">
              <div className="nexus-gradient-text text-5xl font-black">{deal ? priceFor(deal) : '$14.99'}</div>
              <div className="mb-2 text-sm text-[#96a3bd]">{deal ? deal.title + ' deal' : 'monthly style plan'}</div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/games?discount=true" className="nexus-btn-primary"><ShoppingBag className="h-4 w-4" />View deals</Link>
              <Link href="/pro" className="nexus-btn-secondary">Compare plans</Link>
            </div>
          </div>
          <div className="grid gap-3">
            {perks.map((perk, index) => (
              <motion.div
                key={perk}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="nexus-perk"
              >
                <span className="nexus-check"><Check className="h-4 w-4" /></span>
                <span>{perk}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LiveEvents({ games }: { games: Game[] }) {
  const featured = games[0];
  const matches = games.slice(1, 4);

  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader eyebrow="Esports HQ" title="Live Events & Tournaments" subtitle="A Nexus-style events layer using Project game artwork." />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="nexus-event-feature lg:row-span-2">
          {featured ? <img src={imageFor(featured)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#101626] via-[#101626]/82 to-transparent" />
          <div className="relative flex min-h-[420px] flex-col p-7">
            <div className="nexus-pill mb-6"><Trophy className="h-3.5 w-3.5" /> Championship</div>
            <h3 className="text-4xl font-black leading-tight text-white lg:text-5xl">NEXUS WORLD<br />FINALS 2026</h3>
            <p className="mt-3 text-[#aebbd4]">Top squads, Project catalog showcases, and live streams from one Discover hub.</p>
            <div className="mt-8 grid grid-cols-4 gap-2">
              {[
                ['DAYS', '01'],
                ['HRS', '14'],
                ['MIN', '38'],
                ['SEC', '47'],
              ].map(([label, value]) => (
                <div key={label} className="nexus-count">
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-auto flex flex-wrap gap-3 pt-8">
              <Link href="/news" className="nexus-btn-primary">Reserve seat</Link>
              <Link href="/library" className="nexus-btn-secondary"><Calendar className="h-4 w-4" />Schedule</Link>
            </div>
          </div>
        </div>

        {(matches.length ? matches : games.slice(0, 3)).map((game, index) => (
          <Link key={game.id + '-event'} href={'/games/' + game.slug} className="nexus-match-card group">
            <img src={coverFor(game)} alt="" className="absolute right-0 top-0 h-28 w-36 object-cover opacity-35 transition-opacity group-hover:opacity-55" />
            <div className="relative">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-[#96a3bd]">NXS Pro League</span>
                <span className={index % 2 === 0 ? 'nexus-live-badge' : 'nexus-upcoming-badge'}><span />{index % 2 === 0 ? 'Live' : 'Upcoming'}</span>
              </div>
              <h4 className="mb-5 text-lg font-bold text-white">{game.title}</h4>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-black uppercase text-white">Team Void</span>
                <span className="nexus-gradient-text text-2xl font-black">{index + 1} - {index}</span>
                <span className="text-right text-sm font-black uppercase text-white">Pulse GG</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CreatorGrid({ games }: { games: Game[] }) {
  return (
    <section className="mx-auto max-w-[1680px] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <SectionHeader eyebrow="Now Streaming" title="Featured Creators" subtitle="Drop in on gameplay and discovery sessions tied to store games." />
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {games.map((game, index) => (
          <Link key={game.id + '-creator'} href={'/games/' + game.slug} className="nexus-creator-card group">
            <img src={coverFor(game)} alt={game.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080a12] via-[#080a12]/34 to-transparent" />
            <div className="absolute left-3 top-3 flex flex-col gap-1.5">
              <span className="nexus-live-badge"><span />Live</span>
              <span className="inline-flex w-fit items-center gap-1 rounded bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                <Eye className="h-3 w-3" />{Math.round((game.review_count || 42000) / 1000)}K
              </span>
            </div>
            <div className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#2f8cff] to-[#b56cff] opacity-0 transition-opacity group-hover:opacity-100">
              <Play className="h-3.5 w-3.5 fill-white text-white" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="mb-1 text-[10px] font-black uppercase text-[#67e8f9]">{game.title}</div>
              <div className="text-lg font-bold text-white">{creatorNames[index % creatorNames.length]}</div>
              <span className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-white/12 bg-white/8 py-2 text-xs font-black uppercase text-white">Follow</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CatalogCallout() {
  return (
    <section className="mx-auto max-w-[1680px] px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="nexus-catalog-callout">
        <div className="relative max-w-xl">
          <span className="text-[11px] font-black uppercase text-[#67e8f9]">Full catalog</span>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Every game. One library.</h2>
          <p className="mt-3 text-sm leading-6 text-[#aebbd4] sm:text-base">
            Browse trailers, screenshots, reviews, discounts, and details from the Project catalog in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/games" className="nexus-btn-primary">
              Browse all games
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/library" className="nexus-btn-secondary">My library</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080a12]" />}>
      <DiscoverHomeContent />
    </Suspense>
  );
}
