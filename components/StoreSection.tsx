'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useCallback, useEffect } from 'react';
import GameCard, { type Game as CardGame } from '@/components/GameCard';
import type { Game as DbGame } from '@/lib/db';
import { cn } from '@/lib/utils';

function toCardGame(g: DbGame): CardGame {
  return {
    id: g.id,
    slug: g.slug,
    title: g.title,
    developer: g.developer,
    coverImage: g.cover_image,
    price: g.price,
    discount: g.discount_percent,
    rating: g.rating,
    isOwned: g.is_owned,
    genre: g.genre,
    tags: g.tags,
    reviewCount: g.review_count,
    trailerUrl: g.trailer_url,
  };
}

interface StoreSectionProps {
  title: string;
  subtitle?: string;
  href?: string;
  viewMoreLabel?: string;
  games: DbGame[];
  onAddToCart?: (gameId: string) => void;
  onAddToWishlist?: (gameId: string) => void;
  wishlisted?: Set<string>;
  isLoading?: boolean;
  className?: string;
  cardSize?: 'md' | 'lg';
  accent?: 'default' | 'sale';
}

function CardSkeleton() {
  return (
    <div>
      <div className="store-card-skeleton aspect-[3/4] w-full rounded" />
      <div className="mt-3 space-y-2">
        <div className="store-card-skeleton h-3.5 w-[88%] rounded" />
        <div className="store-card-skeleton h-3 w-[45%] rounded" />
      </div>
    </div>
  );
}

export default function StoreSection({
  title,
  subtitle,
  href,
  viewMoreLabel = 'View more',
  games,
  onAddToCart,
  onAddToWishlist,
  wishlisted = new Set(),
  isLoading = false,
  className,
  cardSize = 'md',
  accent = 'default',
}: StoreSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [games.length, isLoading, updateScrollState]);

  const scrollBy = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === 'left' ? -el.clientWidth * 0.85 : el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const cardWidth =
    cardSize === 'lg' ? 'w-[min(72vw,200px)] sm:w-[200px]' : 'w-[min(72vw,200px)] sm:w-[200px]';

  return (
    <section className={cn('store-section', className)}>
      <header className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className={cn('store-section-accent', accent === 'sale' && 'store-section-accent-sale')} />
            <h2 className="store-section-title text-2xl sm:text-3xl">{title}</h2>
          </div>
          {subtitle ? <p className="mt-2 pl-4 text-sm font-medium text-[#b3b3b3]">{subtitle}</p> : null}
          {href ? (
            <Link href={href} className="store-link mt-2.5 inline-block pl-4 sm:hidden">
              {viewMoreLabel}
            </Link>
          ) : null}
        </div>
        <SectionActions
          href={href}
          viewMoreLabel={viewMoreLabel}
          isLoading={isLoading}
          gamesCount={games.length}
          canScrollLeft={canScrollLeft}
          canScrollRight={canScrollRight}
          onScrollLeft={() => scrollBy('left')}
          onScrollRight={() => scrollBy('right')}
        />
      </header>

      <div className="store-rail-wrap">
        {isLoading ? (
          <div className="store-rail">
            {[...Array(7)].map((_, i) => (
              <div key={i} className={cn('shrink-0', cardWidth)}>
                <CardSkeleton />
              </div>
            ))}
          </div>
        ) : games.length === 0 ? null : (
          <div ref={scrollRef} className="store-rail">
            {games.map((game, index) => (
              <div key={`${game.id}-${game.slug}-${index}`} className={cn('shrink-0', cardWidth)}>
                <GameCard
                  game={toCardGame(game)}
                  onAddToCart={onAddToCart}
                  onAddToWishlist={onAddToWishlist}
                  isWishlisted={wishlisted.has(game.id)}
                  variant="epic"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SectionActions({
  href,
  viewMoreLabel,
  isLoading,
  gamesCount,
  canScrollLeft,
  canScrollRight,
  onScrollLeft,
  onScrollRight,
}: {
  href?: string;
  viewMoreLabel: string;
  isLoading: boolean;
  gamesCount: number;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScrollLeft: () => void;
  onScrollRight: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2.5">
      {href ? (
        <Link href={href} className="store-link hidden items-center gap-1.5 sm:inline-flex">
          {viewMoreLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
      {!isLoading && gamesCount > 0 ? (
        <>
          <button type="button" className="store-rail-arrow" disabled={!canScrollLeft} onClick={onScrollLeft} aria-label="Scroll left">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button type="button" className="store-rail-arrow" disabled={!canScrollRight} onClick={onScrollRight} aria-label="Scroll right">
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}
    </div>
  );
}
