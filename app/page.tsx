'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import StoreSection from '@/components/StoreSection';
import StoreQuickNav from '@/components/StoreQuickNav';
import { fetchGames, fetchFeaturedGames, normalizeDbGameRow, type FeaturedGame, type Game } from '@/lib/db';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import {
  ArrowRight,
  Heart,
  Search,
  ShoppingCart,
  Star,
} from 'lucide-react';

function toFeaturedGames(rows: FeaturedGame[]): Game[] {
  return rows.map((r) => r.games).filter((g): g is Game => Boolean(g));
}

function formatStorePrice(price: number) {
  if (price === 0) return 'Free';
  return `$${Math.max(price, 0).toFixed(2)}`;
}

function gameImage(game?: Game) {
  return game?.banner_image || game?.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1400&q=80';
}

function HomeContent() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [trendingFeatured, setTrendingFeatured] = useState<FeaturedGame[]>([]);
  const [newReleaseFeatured, setNewReleaseFeatured] = useState<FeaturedGame[]>([]);
  const [saleFeatured, setSaleFeatured] = useState<FeaturedGame[]>([]);
  const [newReleases, setNewReleases] = useState<Game[]>([]);
  const [onSaleGames, setOnSaleGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const loadHomepage = useCallback(async () => {
    setLoading(true);
    try {
      const [trending, editorialNewReleases, editorialSales, newest, saleRes] = await Promise.all([
        fetchFeaturedGames(supabase, 'trending'),
        fetchFeaturedGames(supabase, 'new_release'),
        fetchFeaturedGames(supabase, 'on_sale'),
        fetchGames(supabase, { limit: 24, sortBy: 'newest' }),
        supabase.from('games').select('*').gt('discount_percent', 0).order('discount_percent', { ascending: false }).limit(24),
      ]);

      setTrendingFeatured(trending);
      setNewReleaseFeatured(editorialNewReleases);
      setSaleFeatured(editorialSales);
      setNewReleases((newest as any)?.games ?? []);
      console.log('NEWEST DATA:', newest);

      if (saleRes.error) {
        console.error('Failed to load sale games:', saleRes.error.message);
      } else if (saleRes.data) {
        setOnSaleGames(
          saleRes.data.map((row) => normalizeDbGameRow(row as unknown as Record<string, unknown>) as Game)
        );
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : JSON.stringify(error);
      console.error('Failed to load homepage:', errorMsg, error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHomepage();
  }, [loadHomepage]);

  const effectiveTrendingGames =
    toFeaturedGames(trendingFeatured).slice(0, 12).length > 0
      ? toFeaturedGames(trendingFeatured).slice(0, 12)
      : newReleases.slice(0, 12);

  const effectiveNewReleases =
    toFeaturedGames(newReleaseFeatured).length > 0
      ? toFeaturedGames(newReleaseFeatured).slice(0, 12)
      : newReleases.length > 0
        ? newReleases.slice(0, 12)
        : [];

  const effectiveOnSaleGames =
    toFeaturedGames(saleFeatured).length > 0
      ? toFeaturedGames(saleFeatured).slice(0, 12)
      : onSaleGames.length > 0
        ? onSaleGames.slice(0, 12)
        : [];

  const spotlightGame = effectiveTrendingGames[0] ?? effectiveNewReleases[0] ?? effectiveOnSaleGames[0];
  const popularGames = [...effectiveTrendingGames, ...effectiveNewReleases].slice(0, 5);
  const categoryGames = [...effectiveNewReleases, ...effectiveTrendingGames, ...effectiveOnSaleGames].slice(0, 6);
  const effectiveTopSellers = [...effectiveTrendingGames, ...effectiveOnSaleGames]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 12);
  const effectiveRecommended = [...effectiveNewReleases, ...effectiveTrendingGames, ...effectiveOnSaleGames]
    .filter((game, index, list) => list.findIndex((item) => item.id === game.id) === index)
    .slice(6, 18);
  const effectiveRecentlyPlayed = [...newReleases].slice(18, 30);
  const wishlistFor = (list: Game[]) => new Set(list.filter((g) => isWishlisted(g.id)).map((g) => g.id));

  if (!spotlightGame) {
    return (
      <div className="store-shell min-h-screen px-6 py-24 text-center text-white">
        {!loading && (
          <>
            <h1 className="text-3xl font-black">No games published yet</h1>
            <p className="mt-3 text-slate-400">Add games from the admin panel after running the Supabase migrations.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="store-shell min-h-screen text-white">
      <div className="mx-auto flex max-w-[1680px] gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* <aside className="store-side-nav">
          <div className="space-y-10">
            <Link href="/" className="store-side-btn store-side-btn-active" aria-label="Home">
              <Home className="h-6 w-6" />
            </Link>
            <Link href="/games" className="store-side-btn" aria-label="Browse games">
              <Grid3X3 className="h-6 w-6" />
            </Link>
            <Link href="/games?sort=rating" className="store-side-btn" aria-label="Top games">
              <Trophy className="h-6 w-6" />
            </Link>
            <Link href="/wishlist" className="store-side-btn" aria-label="Wishlist">
              <Heart className="h-6 w-6" />
            </Link>
          </div>
          <Link href="/library" className="store-side-btn" aria-label="Support">
            <Headphones className="h-6 w-6" />
          </Link>
        </aside> */}

        <main className="min-w-0 flex-1">
          <section className="store-dashboard-hero mb-12">
            - <p style={{ color: "white", fontSize: "12px", marginBottom: "10px" }}>
            -   Impact-Site-Verification: 69996f3c-e366-4eb7-9662-bcf219f580e5
            - </p>
            <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <Link href="/" className="flex items-center gap-2 text-2xl font-black uppercase leading-none tracking-tight text-[#0078f4]">
                <ShoppingCart className="h-8 w-8" />
                Game <span className="text-white">Store</span>
              </Link>
              <form
                onSubmit={(e) => {
                e.preventDefault();
                  const form = e.currentTarget;
                  const q = new FormData(form).get('q')?.toString().trim();
                    if (q) router.push(`/games?q=${encodeURIComponent(q)}`);
                  }}
                className="flex flex-1 justify-center max-w-md lg:ml-0">

                <div className="relative w-full max-w-2xl">
              </div>
            </form>
              {/* <div className="hidden items-center gap-4 lg:flex">
                <Link href="/wishlist" className="store-top-icon" aria-label="Wishlist">
                  <Bell className="h-5 w-5" />
                  <span />
                </Link>
                <Link href="/cart" className="store-top-icon" aria-label="Cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span />
                </Link>
              </div> */}
            </div>

            <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_460px]">
              <article className="store-spotlight-card min-h-[430px]" style={{ backgroundImage: `url(${gameImage(spotlightGame)})` }}>
                <div className="absolute left-5 top-5 z-10 flex flex-wrap gap-2">
                  {(spotlightGame.tags?.length ? spotlightGame.tags : spotlightGame.genre)?.slice(0, 3).map((tag) => (
                    <span key={tag} className="store-glass-tag">{tag}</span>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/92 via-black/28 to-black/8" />
                <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-8">
                  <h1 className="max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                    {spotlightGame.title}
                  </h1>
                  <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/72">
                    {spotlightGame.short_description || spotlightGame.description}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link href={`/games/${spotlightGame.slug}`} className="store-price-pill">
                      {formatStorePrice(spotlightGame.price)}
                    </Link>
                  </div>
                </div>
              </article>

              <aside className="store-popular-panel">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-black">Popular Right Now</h2>
                  <Link href="/games?sort=rating" className="text-sm font-semibold text-white/62 transition hover:text-white">View all</Link>
                </div>
                <div className="space-y-4">
                  {popularGames.map((game, index) => (
                    <Link key={`popular-${game.id}-${game.slug}-${index}`} href={`/games/${game.slug}`} className="store-popular-row">
                      <img src={game.cover_image || game.banner_image} alt="" className="h-16 w-26 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-lg font-semibold">{game.title}</div>
                        <div className="mt-1 w-fit rounded-full bg-white/14 px-3 py-1 text-xs text-white/72">
                          {game.genre?.[0] || 'Action'}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs font-bold text-white/80">
                          <Star className="h-3.5 w-3.5 fill-[#ffc533] text-[#ffc533]" />
                          {Number(game.rating || 4.9).toFixed(1)}
                        </div>
                      </div>
                      <span className="store-mini-price">{formatStorePrice(game.price)}</span>
                    </Link>
                  ))}
                </div>
              </aside>
            </div>

            <div className="mt-8">
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-black">Game Category</h2>
                <StoreQuickNav />
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categoryGames.map((game, index) => (
                  <Link key={`category-${game.id}-${game.slug}-${index}`} href={`/games/${game.slug}`} className="store-category-row">
                    <img src={game.cover_image || game.banner_image} alt="" className="h-28 w-28 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-semibold">{game.title}</div>
                      <div className="mt-1 w-fit rounded-full bg-white/12 px-3 py-1 text-xs text-white/72">{game.genre?.[0] || 'RPG'}</div>
                      <div className="mt-2 flex items-center gap-1 text-xs font-bold text-white/80">
                        <Star className="h-3.5 w-3.5 fill-[#ffc533] text-[#ffc533]" />
                        {Number(game.rating || 4.9).toFixed(1)}
                      </div>
                      <div className="store-wide-price mt-3">{formatStorePrice(game.price)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(game.id);
                      }}
                      className="store-heart-btn"
                      aria-label="Add to wishlist"
                    >
                      <Heart className="h-5 w-5" />
                    </button>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <div className="px-1 pb-20 pt-12">
          <StoreSection
            title="Trending"
            subtitle="The most played games in the store right now"
            href="/games?sort=rating"
            games={effectiveTrendingGames}
            onAddToCart={addToCart}
            onAddToWishlist={toggleWishlist}
            wishlisted={wishlistFor(effectiveTrendingGames)}
            isLoading={loading}
          />

          <StoreSection
            className="mt-16"
            title="Top sellers"
            subtitle="Highly rated premium picks with active discounts"
            href="/games?sort=rating"
            games={effectiveTopSellers}
            onAddToCart={addToCart}
            onAddToWishlist={toggleWishlist}
            wishlisted={wishlistFor(effectiveTopSellers)}
            isLoading={loading}
          />

          <StoreSection
            className="mt-16"
            title="New releases"
            subtitle="The latest games added to the store"
            href="/games?sort=newest"
            games={effectiveNewReleases}
            onAddToCart={addToCart}
            onAddToWishlist={toggleWishlist}
            wishlisted={wishlistFor(effectiveNewReleases)}
            isLoading={loading}
          />

          <StoreSection
            className="mt-16"
            title="Recommended"
            subtitle="Personalized-style picks from genre, rating, and catalog signals"
            href="/games?sort=featured"
            games={effectiveRecommended}
            onAddToCart={addToCart}
            onAddToWishlist={toggleWishlist}
            wishlisted={wishlistFor(effectiveRecommended)}
            isLoading={loading}
          />

          <StoreSection
            className="mt-16"
            title="Recently played"
            subtitle="Quickly jump back into games from your activity rail"
            href="/library"
            games={effectiveRecentlyPlayed}
            onAddToCart={addToCart}
            onAddToWishlist={toggleWishlist}
            wishlisted={wishlistFor(effectiveRecentlyPlayed)}
            isLoading={loading}
          />

          {effectiveOnSaleGames.length > 0 ? (
            <StoreSection
              className="mt-16"
              title="Deals & discounts"
              subtitle="Limited-time savings across the catalog"
              href="/games?discount=true"
              games={effectiveOnSaleGames}
              onAddToCart={addToCart}
              onAddToWishlist={toggleWishlist}
              wishlisted={wishlistFor(effectiveOnSaleGames)}
              isLoading={loading}
              cardSize="lg"
              accent="sale"
            />
          ) : null}
            <section
              className="store-discover-cta mt-16"
              style={{
                background: '#1a1a1a'
              }}
            >
              <div className="relative px-8 py-12 sm:px-14 sm:py-16">
                <div className="relative z-10 max-w-lg">
                  <span className="store-eyebrow">Full catalog</span>
                  <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
                    Every game. One library.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#b3b3b3] sm:text-base">
                    Browse trailers, screenshots, and reviews — then add titles to your cart or wishlist in seconds.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/games" className="store-btn-primary inline-flex items-center gap-2">
                      Browse all games
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/library" className="store-btn-secondary">
                      My library
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function HomeEmpty() {
  return (
    <div className="flex h-72 items-center justify-center bg-[#1f1f1f] text-sm text-[#757575]">
      Connect Supabase and run migrations to load featured titles.
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <HomeContent />
    </Suspense>
  );
}

