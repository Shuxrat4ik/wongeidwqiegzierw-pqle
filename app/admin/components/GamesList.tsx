'use client';

import { Game } from '@/lib/supabase';
import { GameCard } from './GameCard';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GamesListProps {
  games: Game[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selected: Set<string>;
  onSelect: (game: Game) => void;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
}

export function GamesList({
  games,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: GamesListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/50 py-12">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">No games found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Games Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {games.map((game, index) => (
          <GameCard
            key={`${game.id}-${game.slug}-${index}`}
            game={game}
            selected={selected.has(game.id)}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-input bg-muted/30 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Page <span className="font-semibold text-foreground">{currentPage}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                currentPage === 1
                  ? 'border-input text-muted-foreground cursor-not-allowed'
                  : 'border-input hover:border-primary/50 hover:text-primary cursor-pointer'
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, current, and neighbors
                const show =
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1 ||
                  (page === 2 && currentPage <= 2) ||
                  (page === totalPages - 1 && currentPage >= totalPages - 1);

                if (!show) {
                  return null;
                }

                if (page > 1 && Array.from({ length: totalPages }, (_, i) => i + 1)[page - 2] !== page - 1) {
                  return (
                    <div key={`ellipsis-${page}`} className="px-1">
                      ...
                    </div>
                  );
                }

                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={cn(
                      'h-8 w-8 rounded border text-sm font-medium transition-colors',
                      page === currentPage
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input hover:border-primary/50'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                currentPage === totalPages
                  ? 'border-input text-muted-foreground cursor-not-allowed'
                  : 'border-input hover:border-primary/50 hover:text-primary cursor-pointer'
              )}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{games.length}</span> games
          </div>
        </div>
      )}
    </div>
  );
}
