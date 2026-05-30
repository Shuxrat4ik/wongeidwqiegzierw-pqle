'use client';

import { memo } from 'react';
import { Game } from '@/lib/supabase';
import { Pencil, Trash2, Star, DollarSign, Zap } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
  selected?: boolean;
  onSelect?: (game: Game) => void;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
}

export const GameCard = memo(function GameCard({
  game,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: GameCardProps) {
  const isAvailable = !!game.is_available;

  // 👉 FIX: genres outside JSX (IMPORTANT)
  const genres = game.genre?.slice(0, 2) ?? [];
  const extraGenres = game.genre ? game.genre.length - 2 : 0;

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-card transition-all hover:border-primary/50 hover:shadow-md',
        selected && 'border-primary bg-primary/5'
      )}
      onClick={() => onSelect?.(game)}
    >
      {/* Checkbox */}
      {onSelect && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(game)}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-3 top-3 h-4 w-4 cursor-pointer rounded border-gray-300"
        />
      )}

      {/* Cover Image */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-gray-200">
        <Image
          src={game.cover_image || '/placeholder.png'}
          alt={game.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {game.discount_percent > 0 && (
          <div className="absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-sm font-bold text-white">
            -{game.discount_percent}%
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title */}
        <div>
          <h3 className="line-clamp-2 font-semibold text-sm hover:text-primary">
            {game.title}
          </h3>
          <p className="text-xs text-muted-foreground">{game.developer}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-600 font-medium">
              {game.rating.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center gap-1 font-semibold">
            <DollarSign className="h-3 w-3" />
            <span>${game.price.toFixed(2)}</span>
          </div>
        </div>

        {/* Genres */}
        <div className="flex flex-wrap gap-1">
          {genres.map((g) => (
            <span
              key={g}
              className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
            >
              {g}
            </span>
          ))}

          {extraGenres > 0 && (
            <span className="text-xs text-muted-foreground">
              +{extraGenres}
            </span>
          )}
        </div>

        {/* Availability */}
        <div className="flex items-center gap-2">
          {isAvailable ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <Zap className="h-3 w-3" /> Available
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              Unavailable
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(game);
            }}
            className="flex-1 flex items-center justify-center gap-1 rounded bg-primary/10 hover:bg-primary/20 text-primary py-2 text-xs"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(game);
            }}
            className="flex-1 flex items-center justify-center gap-1 rounded bg-red-50 hover:bg-red-100 text-red-600 py-2 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});