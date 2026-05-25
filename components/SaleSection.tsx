'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight } from 'lucide-react';
import GameCard from '@/components/GameCard';
import type { Game } from '@/lib/db';

interface SaleSectionProps {
  games: Game[];
  endDate?: Date;
  onAddToCart?: (gameId: string) => void;
  onAddToWishlist?: (gameId: string) => void;
  wishlisted?: (gameId: string) => boolean;
}

export default function SaleSection({
  games,
  endDate,
  onAddToCart,
  onAddToWishlist,
  wishlisted,
}: SaleSectionProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  const saleGames = games.filter((g) => g.discount_percent && g.discount_percent > 0).slice(0, 6);
  if (saleGames.length === 0) return null;

  return (
    <section className="store-sale-banner">
      <div className="store-sale-banner-accent" />
      <div className="p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Mega Sale</h2>
            <p className="mt-2 text-sm text-[#9e9e9e]">Up to 75% off on selected titles</p>
          </div>
          {endDate && (
            <div className="flex items-center gap-3 bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-4 py-2.5">
              <Clock className="w-4 h-4 text-[#f5a623]" />
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <TimeUnit value={timeLeft.days} label="d" />
                <span className="text-[#9e9e9e]">:</span>
                <TimeUnit value={timeLeft.hours} label="h" />
                <span className="text-[#9e9e9e]">:</span>
                <TimeUnit value={timeLeft.minutes} label="m" />
                <span className="text-[#9e9e9e]">:</span>
                <TimeUnit value={timeLeft.seconds} label="s" />
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {saleGames.map((game, index) => (
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
              }}
              variant="epic"
              onAddToWishlist={onAddToWishlist}
              isWishlisted={wishlisted?.(game.id)}
            />
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/games?discount=true"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#f5a623] hover:bg-[#e8960f] text-[#121212] font-semibold rounded-lg transition-all duration-200"
          >
            View all deals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-lg font-bold leading-none">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] font-medium text-[#9e9e9e] uppercase">{label}</span>
    </div>
  );
}
