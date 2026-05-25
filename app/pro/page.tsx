'use client';

import { useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchCategories, fetchGames, type Category, type GameCard as DBGameCard } from '@/lib/db';
import { filterTopGames, TOP_GAME_CATEGORIES } from '@/lib/top-games';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import GameCard from '@/components/GameCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X } from 'lucide-react';
import Link from 'next/link';

const LIMIT = 20;

function parsePriceFromSearch(v: string | null, fallback: number): number {
  const n = parseInt(v ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function ProStoreContent() {
  const [games, setGames] = useState<DBGameCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999]);
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'rating' | 'price-low' | 'price-high'>('featured');
  const [onlyOnSale, setOnlyOnSale] = useState(false);

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(999);

  const { items: cartItems, addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const isInCart = useCallback(
    (gameId: string) => cartItems.some((item) => item.game_id === gameId),
    [cartItems]
  );

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories(supabase);
        setCategories(data.length > 0 ? data : TOP_GAME_CATEGORIES as Category[]);
      } catch {
        setCategories(TOP_GAME_CATEGORIES as Category[]);
      }
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      try {
        const request = {
          limit: LIMIT,
          offset: (page - 1) * LIMIT,
          searchQuery: searchQuery || undefined,
          sortBy,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
          onlyOnSale: onlyOnSale || undefined,
        };
        const { games: data, total: count } = await fetchGames(supabase, request);
        const shouldUseFallback = data.length === 0 && count === 0;
        const fallback = shouldUseFallback ? filterTopGames(request) : null;
        const nextGames = (fallback?.games ?? data) as DBGameCard[];
        const nextTotal = fallback?.total ?? count;

        setTotal(nextTotal);
        setGames((prev) => {
          if (page === 1) return nextGames;
          const seen = new Set(prev.map((g) => g.id));
          const next = [...prev];
          for (const g of nextGames) {
            if (!seen.has(g.id)) next.push(g);
          }
          return next;
        });
      } catch {
        const fallback = filterTopGames({
          limit: LIMIT,
          offset: (page - 1) * LIMIT,
          searchQuery: searchQuery || undefined,
          sortBy,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
          onlyOnSale: onlyOnSale || undefined,
        });
        setTotal(fallback.total);
        setGames((prev) => (page === 1 ? fallback.games as DBGameCard[] : [...prev, ...(fallback.games as DBGameCard[])]));
      } finally {
        setLoading(false);
      }
    };

    void loadGames();
  }, [page, searchQuery, sortBy, priceRange, selectedCategories, onlyOnSale]);

  const hasActiveFilters = useMemo(() => {
    return !!searchQuery || selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < 999 || onlyOnSale;
  }, [searchQuery, selectedCategories, priceRange, onlyOnSale]);

  const totalPages = Math.ceil(total / LIMIT);
  const hasMore = page < totalPages;

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach((g) => (g.genre ?? []).forEach((gen) => set.add(gen)));
    return Array.from(set).sort();
  }, [games]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceRange([0, 999]);
    setSortBy('featured');
    setOnlyOnSale(false);
    setPage(1);
  };

  const gridColsClass = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div className="min-h-screen bg-[#07080d] text-white">
      <div className="border-b border-white/[0.06] bg-[#07080d]/70 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-xs font-bold text-sky-200 uppercase tracking-wide">Pro Store</span>
              </div>
              <h1 className="mt-3 text-3xl font-black">
                Premium drops, pro rails,{" "}
                <span className="text-sky-300">zero downtime</span>
              </h1>
              <p className="text-slate-300 mt-2 text-sm max-w-2xl">
                A pro-tier storefront inspired by Epic Games Store — tuned for speed, clarity, and a punchy gaming atmosphere.
              </p>
            </div>

            <div className="w-full sm:w-[420px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search pro titles..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-slate-900/40 border-white/[0.08] pl-10 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top pro hero strip */}
        <div className="mb-8 rounded-2xl border border-white/[0.08] bg-[#0b0d16] overflow-hidden">
          <div className="p-6 sm:p-8 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-bold text-amber-300 uppercase tracking-wide">Featured Pro Feed</div>
              <div className="mt-2 text-2xl sm:text-3xl font-black">
                New releases, curated weekly.
              </div>
              <p className="mt-3 text-slate-300 text-sm max-w-xl">
                Built for the big screens: bold outlines, chunky cards, and a fearless catalog feel.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/" className="inline-flex items-center gap-2 rounded-lg bg-white/[0.06] border border-white/[0.08] px-4 py-2 text-sm font-bold hover:bg-white/[0.10]">
                  View Regular Store →
                </Link>
                <Link href="/library" className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-black hover:bg-sky-400">
                  Go to Library
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex-1">
                <div className="text-xs text-slate-300 uppercase tracking-wide font-bold">Sort</div>
                <div className="mt-2">
                  <Select
                    value={sortBy}
                    onValueChange={(val: any) => {
                      setSortBy(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="border-white/[0.08] bg-[#0b0d16] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/[0.08] bg-[#0b0d16] text-white">
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 flex-1">
                <div className="text-xs text-slate-300 uppercase tracking-wide font-bold">Deals</div>
                <div className="mt-2 flex items-center gap-2">
                  <Checkbox
                    checked={onlyOnSale}
                    onCheckedChange={(v) => {
                      setOnlyOnSale(!!v);
                      setPage(1);
                    }}
                    className="border-white/[0.10]"
                  />
                  <span className="text-sm text-slate-200">On sale only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">
              {hasActiveFilters && (
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  size="sm"
                  className="w-full border-white/[0.12] text-slate-200 hover:bg-white/[0.06]"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase text-slate-300">Price Range</h3>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={10}
                  value={priceRange}
                  onValueChange={(val) => {
                    setPriceRange([val[0], val[1]]);
                    setPage(1);
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase text-slate-300">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={selectedCategories.includes(category.id)}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                        className="border-white/[0.10]"
                      />
                      <span className="text-sm text-slate-200">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">Pro tip</div>
                <div className="mt-2 text-sm text-slate-200 leading-relaxed">
                  Videos + multi-image pages are guaranteed when data is present (admin-managed catalog media).
                </div>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="lg:col-span-3">
            <div className="mb-6 lg:hidden">
              <Button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                variant="outline"
                size="sm"
                className="border-white/[0.12] text-slate-200 hover:bg-white/[0.06]"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {mobileFilterOpen && (
              <div className="mb-6 space-y-4 rounded-xl border border-white/[0.08] bg-[#0b0d16] p-4 lg:hidden">
                {hasActiveFilters && (
                  <Button
                    onClick={handleClearFilters}
                    variant="outline"
                    size="sm"
                    className="w-full border-white/[0.12] text-slate-200 hover:bg-white/[0.06]"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase text-slate-300">Price Range</h3>
                  <Slider
                    min={0}
                    max={maxPrice}
                    step={10}
                    value={priceRange}
                    onValueChange={(val) => {
                      setPriceRange([val[0], val[1]]);
                      setPage(1);
                    }}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-between text-sm text-slate-400">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase text-slate-300">Deals</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={onlyOnSale}
                      onCheckedChange={(v) => {
                        setOnlyOnSale(!!v);
                        setPage(1);
                      }}
                      className="border-white/[0.10]"
                    />
                    <span className="text-sm text-slate-200">On sale only</span>
                  </label>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold uppercase text-slate-300">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                          className="border-white/[0.10]"
                        />
                        <span className="text-sm text-slate-200">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Showing {games.length > 0 ? (page - 1) * LIMIT + 1 : 0} – {Math.min(page * LIMIT, total)} of {total} games
              </p>
            </div>

            {loading ? (
              <div className={gridColsClass}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-48 w-full rounded-lg bg-white/[0.04]" />
                    <Skeleton className="h-6 w-3/4 rounded bg-white/[0.04]" />
                    <Skeleton className="h-4 w-1/2 rounded bg-white/[0.04]" />
                    <Skeleton className="h-8 w-full rounded bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            ) : games.length === 0 ? (
              <div className="rounded-xl border border-white/[0.10] bg-white/[0.03] py-12 text-center">
                <p className="mb-4 text-lg text-slate-300">No pro games found</p>
                <Button
                  onClick={handleClearFilters}
                  variant="outline"
                  className="border-white/[0.12] text-slate-200 hover:bg-white/[0.06]"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className={gridColsClass}>
                  {games.map((game, index) => (
                    <GameCard
                      key={`${game.id}-${game.slug}-${index}`}
                      game={{
                        id: game.id,
                        slug: game.slug,
                        title: game.title,
                        developer: game.developer,
                        coverImage: game.cover_image,
                        price: game.price,
                        discount: game.discount_percent,
                        rating: game.rating,
                        isOwned: game.is_owned,
                      }}
                      onAddToCart={() => addToCart(game.id)}
                      onAddToWishlist={() => toggleWishlist(game.id)}
                      isWishlisted={isWishlisted(game.id)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-12 flex justify-center">
                    <Button
                      onClick={() => setPage((p) => p + 1)}
                      size="lg"
                      className="bg-sky-500 hover:bg-sky-400 text-white"
                    >
                      Load More Pro Titles
                    </Button>
                  </div>
                )}
                {!hasMore && page > 1 && (
                  <div className="mt-12 text-center text-slate-400">
                    <p>No more pro games.</p>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ProStorePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07080d] text-slate-400">
          Loading pro store…
        </div>
      }
    >
      <ProStoreContent />
    </Suspense>
  );
}
