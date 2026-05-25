'use client';

import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import type { Game } from '@/lib/db';
import { cn } from '@/lib/utils';

const FALLBACK =
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80';

interface StoreSpotlightProps {
  game: Game;
  label?: string;
  className?: string;
}

export default function StoreSpotlight({ game, label = 'Featured pick', className }: StoreSpotlightProps) {
  const image = game.banner_image || game.cover_image || FALLBACK;
  const discount = game.discount_percent ?? 0;
  const price = game.price ?? 0;
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const isFree = price === 0;

  return (
    <article className={cn('store-spotlight group', className)}>
      <Link href={`/games/${game.slug}`} className="store-spotlight-media relative block overflow-hidden">
        <img
          src={image}
          alt=""
          className="aspect-[21/9] min-h-[240px] w-full h-full object-cover object-center transition duration-1200 ease-out group-hover:scale-[1.04] sm:min-h-[300px]"
          onError={(e) => {
            e.currentTarget.src = FALLBACK;
          }}
        />
        <div className="store-spotlight-gradient-v pointer-events-none absolute inset-0" />
        <div className="store-spotlight-gradient-h pointer-events-none absolute inset-0" />
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-6 sm:p-10 lg:p-12">
          <span className="store-eyebrow mb-4 w-fit">{label}</span>
          <h2 className="max-w-2xl text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{game.title}</h2>
          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-relaxed text-[#b8b8b8] sm:text-base">
            {game.short_description || game.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#d4d4d4]">
              <Star className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
              {game.rating.toFixed(1)}
            </span>
            {!isFree ? (
              <span className="text-lg font-bold text-white">
                {discount > 0 ? (
                  <>
                    <span className="mr-2 text-sm font-normal text-[#888888] line-through">${price.toFixed(2)}</span>
                    ${finalPrice.toFixed(2)}
                  </>
                ) : (
                  `$${price.toFixed(2)}`
                )}
              </span>
            ) : (
              <span className="text-lg font-bold text-[#26bbff]">Free</span>
            )}
            <span className="store-btn-primary inline-flex items-center gap-2">
              <Play className="h-4 w-4 fill-current" />
              View game
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
