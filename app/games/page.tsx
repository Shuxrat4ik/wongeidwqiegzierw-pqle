'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { fetchGames, fetchCategories, GameCard as DBGameCard, Category } from '@/lib/db';
import { cn } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import GameGrid from '@/components/GameGrid';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronLeft, ChevronRight, Filter, Gamepad2, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';

const LIMIT = 50;
const countFormatter = new Intl.NumberFormat('en-US');
const PRICE_FILTERS = [
  { id: 'free', label: 'Free', minPrice: 0, maxPrice: 0 },
  { id: 'under-5', label: 'Under $5.00', minPrice: 0, maxPrice: 5 },
  { id: 'under-10', label: 'Under $10.00', minPrice: 0, maxPrice: 10 },
  { id: 'under-20', label: 'Under $20.00', minPrice: 0, maxPrice: 20 },
  { id: 'under-30', label: 'Under $30.00', minPrice: 0, maxPrice: 30 },
  { id: 'above-1499', label: '$14.99 and above', minPrice: 14.99, maxPrice: undefined },
] as const;
type PriceFilterId = (typeof PRICE_FILTERS)[number]['id'];

function GamesCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [games, setGames] = useState<DBGameCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('categories')?.split(',').filter(Boolean) || []
  );
  const [priceFilter, setPriceFilter] = useState<PriceFilterId | null>(() => {
    const value = searchParams.get('price');
    return PRICE_FILTERS.some((option) => option.id === value) ? (value as PriceFilterId) : null;
  });
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'rating' | 'price-low' | 'price-high'>(
    (searchParams.get('sort') as any) || 'featured'
  );
  const [onlyOnSale, setOnlyOnSale] = useState(() => searchParams.get('discount') === 'true');

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const selectedPriceOption = PRICE_FILTERS.find((option) => option.id === priceFilter);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories(supabase);
        setCategories(data);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Load games with filters
  useEffect(() => {
    const loadGames = async () => {
      setLoading(true);
      try {
        const request = {
          limit: LIMIT,
          offset: (page - 1) * LIMIT,
          searchQuery: searchQuery || undefined,
          sortBy,
          minPrice: selectedPriceOption?.minPrice,
          maxPrice: selectedPriceOption?.maxPrice,
          categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
          onlyOnSale: onlyOnSale || undefined,
        };
        const { games: data, total: count } = await fetchGames(supabase, request);
        const nextGames = data as DBGameCard[];
        const nextTotal = count;

        setTotal(nextTotal);
        setGames(nextGames);
      } catch {
        setTotal(0);
        if (page === 1) setGames([]);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, [page, searchQuery, sortBy, selectedPriceOption, selectedCategories, onlyOnSale]);

  // Keep URL in sync with filters (replace so we do not spam history)
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (selectedCategories.length > 0) params.set('categories', selectedCategories.join(','));
    if (priceFilter) params.set('price', priceFilter);
    if (sortBy !== 'featured') params.set('sort', sortBy);
    if (onlyOnSale) params.set('discount', 'true');

    const next = params.toString();
    if (next === searchParams.toString()) return;

    const newUrl = next ? `/games?${next}` : '/games';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, selectedCategories, priceFilter, sortBy, onlyOnSale, router, searchParams]);

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

  const handlePriceToggle = (filterId: PriceFilterId) => {
    setPriceFilter((current) => (current === filterId ? null : filterId));
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setPriceFilter(null);
    setSortBy('featured');
    setOnlyOnSale(false);
    setPage(1);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    priceFilter ||
    onlyOnSale;
  const activeFilterCount = [
    searchQuery.trim().length > 0,
    selectedCategories.length > 0,
    !!priceFilter,
    sortBy !== 'featured',
    onlyOnSale,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(total / LIMIT);
  const visibleStart = games.length > 0 ? (page - 1) * LIMIT + 1 : 0;
  const visibleEnd = Math.min(page * LIMIT, total);
  const wishlistedSet = new Set(games.filter((game) => isWishlisted(game.id)).map((game) => game.id));
  const paginationPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((pageNumber) => {
    return (
      pageNumber === 1 ||
      pageNumber === totalPages ||
      Math.abs(pageNumber - page) <= 1 ||
      (pageNumber === 2 && page <= 2) ||
      (pageNumber === totalPages - 1 && page >= totalPages - 1)
    );
  });

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.min(Math.max(nextPage, 1), totalPages);
    setPage(safePage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <section className="border-b border-[#2a2a2a]">
        <div className="relative mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8 lg:py-14">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#26bbff]">Browse</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Discover your next game
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#999999] sm:text-base">
                Filter by genre, price, and rating. Every title includes media, reviews, and one-click library delivery.
              </p>
            </div>

            {/* <div className="rounded p-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Games', value: total || 1000, icon: Gamepad2 },
                  { label: 'Loaded', value: games.length, icon: Sparkles },
                  { label: 'Page', value: page, icon: SlidersHorizontal },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/[0.08] bg-white/[0.04] p-3">
                    <item.icon className="mb-2 h-4 w-4 text-amber-300" />
                    <div className="text-lg font-black text-white">{countFormatter.format(item.value)}</div>
                    <div className="text-[11px] font-semibold uppercase text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-200" />
                <Input
                  type="text"
                  placeholder="Search GTA V, Elden Ring, racing, horror..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-12 rounded-lg border-white/10 bg-white/[0.06] pl-10 text-white placeholder:text-slate-500 focus-visible:ring-cyan-300"
                />
              </div>
            </div> */}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_280px]">
          <aside className="hidden lg:block lg:order-2 lg:mt-12">
            <div className="overflow-hidden rounded-2xl border border-white/[0.13] bg-[#0B0F19] text-white shadow-xl shadow-black/25">
              <div className="space-y-4 px-4 pb-5 pt-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black tracking-tight">Filters ({activeFilterCount})</h2>
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="text-base font-medium text-[#22b8ff] transition hover:text-white"
                    >
                      Reset
                    </button>
                  ) : (
                    <span className="text-base  font-medium text-blue-500">Reset</span>
                  )}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
                  <Input
                    type="text"
                    placeholder="Keywords"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="h-11 rounded-md border-0 bg-[#303136] pl-10 text-sm text-white placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-[#22b8ff]"
                  />
                </div>
              </div>

              <Accordion type="multiple" defaultValue={['price', 'genre']} className="border-t border-white/[0.12]">
                <AccordionItem value="events" className="border-b border-white/[0.12]">
                  <AccordionTrigger className="px-4 py-4 text-base font-medium text-white hover:no-underline">
                    Events
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <Select
                      value={sortBy}
                      onValueChange={(val: any) => {
                        setSortBy(val);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="rounded-md border-white/10 bg-[#303136] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-slate-700 bg-slate-950">
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="rating">Top Rated</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="price" className="border-b border-white/[0.12]">
                  <AccordionTrigger className="px-4 py-4 text-base font-medium text-white hover:no-underline">
                    <span>Price</span>
                    {(priceFilter || onlyOnSale) && (
                      <span className="ml-auto mr-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-xs font-bold text-white">
                        {(priceFilter ? 1 : 0) + (onlyOnSale ? 1 : 0)}
                      </span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2.5">
                      {PRICE_FILTERS.map((option) => (
                        <label key={option.id} className="flex cursor-pointer items-center gap-2.5">
                          <Checkbox
                            checked={priceFilter === option.id}
                            onCheckedChange={() => handlePriceToggle(option.id)}
                            className="border-slate-500"
                          />
                          <span className="text-xs text-slate-300">{option.label}</span>
                        </label>
                      ))}
                      <label className="flex cursor-pointer items-center gap-2.5">
                        <Checkbox
                          checked={onlyOnSale}
                          onCheckedChange={(v) => {
                            setOnlyOnSale(!!v);
                            setPage(1);
                          }}
                          className="border-slate-500"
                        />
                        <span className="text-xs text-slate-300">Discounted</span>
                      </label>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="genre" className="border-b border-white/[0.12]">
                  <AccordionTrigger className="px-4 py-4 text-base font-medium text-white hover:no-underline">
                    <span>Genre</span>
                    {selectedCategories.length > 0 && (
                      <span className="ml-auto mr-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/15 px-2 text-xs font-bold text-white">
                        {selectedCategories.length}
                      </span>
                    )}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="max-h-[260px] space-y-2.5 overflow-auto pr-1">
                      {categories.map((category) => (
                        <label key={category.id} className="flex cursor-pointer items-center gap-2.5">
                          <Checkbox
                            checked={selectedCategories.includes(category.id)}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                            className="border-slate-500"
                          />
                          <span className="text-xs text-slate-300">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="features" className="border-b border-white/[0.12]">
                  <AccordionTrigger className="px-4 py-4 text-base font-medium text-white hover:no-underline">
                    Features
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-xs text-slate-400">
                    No options available
                  </AccordionContent>
                </AccordionItem>

                {['Types', 'Platform', 'Subscriptions'].map((label) => (
                  <AccordionItem key={label} value={label.toLowerCase()} className="border-b border-white/[0.12] last:border-b-0">
                    <AccordionTrigger className="px-4 py-4 text-base font-medium text-white hover:no-underline">
                      {label}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-xs text-slate-400">
                      No options available
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </aside>

          <main className="lg:order-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-300">
                  Loaded {countFormatter.format(games.length)} of {countFormatter.format(total)} games
                </p>
                <p className="text-xs text-slate-500">
                  Showing rank {countFormatter.format(visibleStart)} - {countFormatter.format(visibleEnd)} in this run
                </p>
              </div>
              <Button
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                variant="outline"
                size="sm"
                className="rounded-lg border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1] lg:hidden"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>

            {mobileFilterOpen && (
              <div className="mb-6 space-y-4 rounded-lg border border-white/[0.08] bg-black/45 p-4 backdrop-blur-xl lg:hidden">
                {hasActiveFilters ? (
                  <Button onClick={handleClearFilters} variant="outline" size="sm" className="w-full rounded-lg border-white/10 text-slate-200 hover:bg-white/10">
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                ) : null}

                <div>
                  <h3 className="mb-2 text-xs font-black uppercase text-slate-500">Sort</h3>
                  <Select
                    value={sortBy}
                    onValueChange={(val: any) => {
                      setSortBy(val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="rounded-lg border-white/10 bg-white/[0.06] text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-950">
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="rating">Top Rated</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-black uppercase text-slate-500">Price</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PRICE_FILTERS.map((option) => (
                      <label key={option.id} className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={priceFilter === option.id}
                          onCheckedChange={() => handlePriceToggle(option.id)}
                          className="border-slate-500"
                        />
                        <span className="text-sm text-slate-300">{option.label}</span>
                      </label>
                    ))}
                    <label className="flex cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={onlyOnSale}
                        onCheckedChange={(v) => {
                          setOnlyOnSale(!!v);
                          setPage(1);
                        }}
                        className="border-slate-500"
                      />
                      <span className="text-sm text-slate-300">Discounted</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-xs font-black uppercase text-slate-500">Genres</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex cursor-pointer items-center gap-2">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                          className="border-slate-500"
                        />
                        <span className="text-sm text-slate-300">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.04]">
                    <Skeleton className="aspect-[3/4] w-full rounded-none bg-slate-800" />
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-5 w-4/5 rounded bg-slate-800" />
                      <Skeleton className="h-4 w-1/2 rounded bg-slate-800" />
                      <Skeleton className="h-10 w-full rounded bg-slate-800" />
                    </div>
                  </div>
                ))}
              </div>
            ) : games.length === 0 ? (
              <div className="rounded-lg border border-white/[0.08] bg-black/35 py-16 text-center backdrop-blur-xl">
                <p className="mb-4 text-lg text-slate-300">No games found</p>
                <Button onClick={handleClearFilters} variant="outline" className="rounded-lg border-white/10 text-slate-200 hover:bg-white/10">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <GameGrid
                  games={games}
                  onAddToCart={addToCart}
                  onAddToWishlist={toggleWishlist}
                  wishlisted={wishlistedSet}
                  columns={5}
                  layout="epic"
                />

                {totalPages > 1 && (
                  <div className="mt-10 flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      aria-label="Previous page"
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors',
                        page === 1
                          ? 'cursor-not-allowed opacity-45'
                          : 'hover:bg-white/[0.04] hover:text-slate-200'
                      )}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2">
                      {paginationPages.map((pageNumber, index) => {
                        const previous = paginationPages[index - 1];
                        const showEllipsis = previous && pageNumber - previous > 1;

                        return (
                          <div key={pageNumber} className="flex items-center gap-2">
                            {showEllipsis && (
                              <span className="px-1 text-sm font-medium text-slate-500">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(pageNumber)}
                              className={cn(
                                'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium leading-none transition-colors',
                                pageNumber === page
                                  ? 'bg-sky-500 text-white'
                                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                              )}
                            >
                              {pageNumber}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      aria-label="Next page"
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors',
                        page === totalPages
                          ? 'cursor-not-allowed opacity-45'
                          : 'hover:bg-white/[0.04] hover:text-slate-100'
                      )}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
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

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-500">
          Loading catalog…
        </div>
      }
    >
      <GamesCatalogContent />
    </Suspense>
  );
}
