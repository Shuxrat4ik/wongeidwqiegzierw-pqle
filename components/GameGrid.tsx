import React from 'react';
import GameCard, { Game as CardGame } from './GameCard';
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

interface GameGridProps {
  games: DbGame[];
  onAddToCart?: (gameId: string) => void;
  onAddToWishlist?: (gameId: string) => void;
  wishlisted?: Set<string>;
  isLoading?: boolean;
  emptyMessage?: string;
  columns?: number;
  mosaic?: boolean;
  startRank?: number;
  layout?: 'grid' | 'epic';
}

const GameGrid: React.FC<GameGridProps> = ({
  games,
  onAddToCart,
  onAddToWishlist,
  wishlisted = new Set(),
  isLoading = false,
  emptyMessage = 'No games found.',
  columns = 4,
  mosaic = false,
  startRank = 1,
  layout = 'grid',
}) => {
  const gridColsClass =
    {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
      6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
    }[columns] || 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4';

  if (isLoading) {
    return (
      <div className={`grid gap-5 ${gridColsClass}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-lg border border-white/[0.06] bg-[#0c0e14]">
            <div className="aspect-[3/4] animate-pulse bg-slate-800/80" />
            <div className="space-y-3 p-4">
              <div className="h-4 w-[80%] animate-pulse rounded bg-slate-800" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-800" />
              <div className="h-8 w-full animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0c0e14]/60 py-16">
        <p className="text-lg font-medium text-slate-400">{emptyMessage}</p>
        <p className="mt-2 text-sm text-slate-600">Try clearing filters or broadening your search.</p>
      </div>
    );
  }

  return (
    <div className={cn('grid auto-rows-fr gap-5', gridColsClass, mosaic && 'items-stretch')}>
      {games.map((game, index) => {
        const pattern = index % 12;
        const variant = mosaic && (pattern === 0 || pattern === 7) ? 'wide' : mosaic && pattern === 4 ? 'tall' : 'standard';
        const cardClassName = mosaic
          ? cn(
              pattern === 0 && 'sm:col-span-2',
              pattern === 7 && 'lg:col-span-2',
              pattern === 2 && 'lg:mt-8',
              pattern === 5 && 'xl:mt-10',
              pattern === 9 && 'lg:mt-4'
            )
          : undefined;

        return (
          <GameCard
            key={`${game.id}-${game.slug}-${index}`}
            game={toCardGame(game)}
            onAddToCart={onAddToCart}
            onAddToWishlist={onAddToWishlist}
            isWishlisted={wishlisted.has(game.id)}
            rank={mosaic ? startRank + index : undefined}
            variant={layout === 'epic' ? 'epic' : variant}
            className={cardClassName}
          />
        );
      })}
    </div>
  );
};

export default GameGrid;
