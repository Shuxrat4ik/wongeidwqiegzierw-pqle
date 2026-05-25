'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { cardHoverVariants, imageRevealVariants, badgePulseVariants } from '@/lib/animations';

export interface Game {
  id: string;
  slug?: string;
  title: string;
  developer: string;
  coverImage: string;
  price: number;
  discount?: number;
  rating: number;
  isOwned?: boolean;
  genre?: string[];
  tags?: string[];
  reviewCount?: number;
  trailerUrl?: string | null;
}

interface GameCardProps {
  game: Game;
  onAddToCart?: (gameId: string) => void;
  onAddToWishlist?: (gameId: string) => void;
  isWishlisted?: boolean;
  rank?: number;
  variant?: 'standard' | 'wide' | 'tall' | 'epic';
  className?: string;
}

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80';

const GameCard: React.FC<GameCardProps> = ({
  game,
  onAddToWishlist,
  isWishlisted = false,
  variant = 'epic',
  className,
}) => {
  const discount = game.discount ?? 0;
  const discountedPrice = discount > 0 ? game.price * (1 - discount / 100) : game.price;
  const titleHref = game.slug ? `/games/${game.slug}` : undefined;
  const isFree = game.price === 0;

  return (
    <motion.article 
      className={cn('store-card group', className)}
      variants={cardHoverVariants}
      initial="initial"
    >
      <CardMedia
        game={game}
        titleHref={titleHref}
        discount={discount}
        isFree={isFree}
        isWishlisted={isWishlisted}
        onAddToWishlist={onAddToWishlist}
        aspectClass={variant === 'wide' ? 'aspect-[16/10]' : variant === 'tall' ? 'aspect-[5/7]' : 'aspect-[3/4]'}
      />
      <CardMeta game={game} titleHref={titleHref} isFree={isFree} discount={discount} discountedPrice={discountedPrice} />
    </motion.article>
  );
};

function CardMedia({
  game,
  titleHref,
  isFree,
  discount,
  isWishlisted,
  onAddToWishlist,
  aspectClass,
}: {
  game: Game;
  titleHref?: string;
  isFree: boolean;
  discount: number;
  isWishlisted: boolean;
  onAddToWishlist?: (id: string) => void;
  aspectClass?: string;
}) {
  const image = game.coverImage || FALLBACK_COVER;
  return (
    <div className="store-card-media relative overflow-hidden rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#121212]">
      <Link href={titleHref || `/games/${game.slug}`} className="block" aria-label={game.title}>
        <motion.img
          src={image}
          alt=""
          className={cn('w-full object-cover transition duration-500 ease-out', aspectClass || 'aspect-[3/4]')}
          variants={imageRevealVariants}
          initial="initial"
          animate="animate"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_COVER;
          }}
        />
      </Link>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="absolute left-3 top-3 z-[2] flex flex-col gap-1.5">
        {isFree && (
          <motion.span 
            className="store-badge-free"
            variants={badgePulseVariants}
            animate="animate"
          >
            Free
          </motion.span>
        )}
        {discount > 0 && (
          <motion.span 
            className="store-badge-sale"
            variants={badgePulseVariants}
            animate="animate"
          >
            -{discount}%
          </motion.span>
        )}
      </div>
      <motion.button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddToWishlist?.(game.id);
        }}
        className={cn(
          'absolute right-3 top-3 z-[3] flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white backdrop-blur-lg transition-all duration-300',
          'opacity-0 group-hover:opacity-100',
          'hover:bg-black/90 hover:border-white/30',
          isWishlisted && 'opacity-100 border-[#0078f4] bg-[#0078f4] hover:bg-[#0056d6]'
        )}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart size={18} strokeWidth={2.5} fill={isWishlisted ? 'currentColor' : 'none'} />
      </motion.button>
    </div>
  );
}

function CardMeta({
  game,
  titleHref,
  isFree,
  discount,
  discountedPrice,
}: {
  game: Game;
  titleHref?: string;
  isFree: boolean;
  discount: number;
  discountedPrice: number;
}) {
  return (
    <div className="mt-3 min-w-0 space-y-2 px-0.5">
      {titleHref ? (
        <Link
          href={titleHref}
          className="line-clamp-2 text-sm font-bold leading-snug text-white transition-colors hover:text-[#0078f4] duration-200"
        >
          {game.title}
        </Link>
      ) : (
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">{game.title}</h3>
      )}
      <p className="truncate text-xs font-medium text-[#b3b3b3]">{game.developer}</p>
      {isFree ? (
        <p className="pt-1 text-sm font-bold text-[#0078f4]">Free</p>
      ) : (
        <div className="flex items-baseline gap-2 pt-1">
          {discount > 0 && game.price > 0 ? (
            <span className="text-xs font-medium text-[#707070] line-through decoration-1">${game.price.toFixed(2)}</span>
          ) : null}
          <span className="text-sm font-bold text-white">${discountedPrice.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

export default GameCard;
