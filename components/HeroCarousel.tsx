'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Heart, Film, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toYouTubeEmbedUrl } from '@/lib/media';
import { cn } from '@/lib/utils';
import { modalBackdropVariants, modalContentVariants, floatingVariants } from '@/lib/animations';

export interface HeroCarouselGame {
  id: string;
  slug: string;
  title: string;
  description: string;
  backgroundImage: string;
  tags?: string[];
  trailerUrl?: string | null;
}

interface HeroCarouselProps {
  games: HeroCarouselGame[];
  onPlay?: (gameId: string) => void;
  onAddToWishlist?: (gameId: string) => void;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  height?: string;
}

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=80';

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  games,
  onPlay,
  onAddToWishlist,
  autoPlay = true,
  autoPlayInterval = 8000,
  height = 'h-[min(38rem,78vh)]',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    setTrailerOpen(false);
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (!isAutoPlaying || games.length <= 1) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / autoPlayInterval) * 100);
      setProgress(pct);
      if (pct >= 100) {
        setCurrentIndex((i) => (i + 1) % games.length);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isAutoPlaying, games.length, autoPlayInterval, currentIndex]);

  useEffect(() => {
    const target = thumbRefs.current[currentIndex];
    if (target) {
      target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }, [currentIndex]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(autoPlay), 2000);
  };

  if (games.length === 0) {
    return (
      <HeroEmptyState height={height} />
    );
  }

  const currentGame = games[currentIndex];
  const trailerEmbed = toYouTubeEmbedUrl(currentGame.trailerUrl ?? null);
  const thumbGames = games.slice(0, 6);

  return (
    <div
      className={cn('store-hero group relative overflow-hidden bg-[#121212]', height)}
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(autoPlay)}
    >
      <div className="store-hero-overlay" />
      <div className="grid h-full lg:grid-cols-[minmax(0,1fr)_272px]">
        <div className="relative min-h-[300px] h-full">
          <HeroSlides games={games} currentIndex={currentIndex} />
          <HeroGradients />
          <HeroContent
            game={currentGame}
            trailerEmbed={trailerEmbed}
            onPlay={onPlay}
            onAddToWishlist={onAddToWishlist}
            onTrailerOpen={() => setTrailerOpen(true)}
          />
          {games.length > 1 ? (
            <div className="store-hero-progress">
              <div className="store-hero-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </div>
        {thumbGames.length > 1 ? (
          <HeroThumbs games={thumbGames} currentIndex={currentIndex} onSelect={goToSlide} thumbRefs={thumbRefs} />
        ) : null}
      </div>
      {trailerOpen && trailerEmbed ? <TrailerModal embedUrl={trailerEmbed} onClose={() => setTrailerOpen(false)} /> : null}
    </div>
  );
};

function HeroEmptyState({ height }: { height: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-[#1f1f1f]', height)}>
      <p className="text-sm text-[#757575]">Featured titles will appear here once the catalog is connected.</p>
    </div>
  );
}

function HeroGradients() {
  return (
    <>
      <div className="store-hero-gradient-v absolute inset-0 z-20" />
      <div className="store-hero-gradient-h absolute inset-0 z-20" />
    </>
  );
}

function HeroSlides({ games, currentIndex }: { games: HeroCarouselGame[]; currentIndex: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {games.map((game, index) => (
        <HeroSlide key={`${game.id}-${game.slug}-${index}`} game={game} active={index === currentIndex} />
      ))}
    </div>
  );
}

function HeroSlide({ game, active }: { game: HeroCarouselGame; active: boolean }) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!frameRef.current || !cardRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 12;
    const rotateX = (0.5 - y) * 10;
    cardRef.current.style.transform = `perspective(1800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    }
  };

  return (
    <div
      className={cn(
            'absolute inset-0 transition-opacity duration-800 ease-out',
        active ? 'z-10 opacity-100' : 'z-0 opacity-0'
      )}
    >
      <div
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.65)] transition-all duration-500 hover:shadow-[0_32px_80px_rgba(0,120,244,0.35),_inset_0_0_40px_rgba(0,120,244,0.1)]"
        style={{ perspective: 1800 }}
      >
        <div
          ref={cardRef}
          className={cn('relative h-full w-full transition-transform duration-500 ease-out will-change-transform', active && 'scale-105')}
          style={{ transformStyle: 'preserve-3d' }}
        >
          <img
            src={game.backgroundImage || FALLBACK_HERO}
            alt=""
            className="relative h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_HERO;
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,120,244,0.15),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(0,120,244,0.12),transparent_35%)] mix-blend-screen opacity-70" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#121212]/80 via-transparent to-[#121212]/5" />
        </div>
      </div>
    </div>
  );
}

function HeroContent({
  game,
  trailerEmbed,
  onPlay,
  onAddToWishlist,
  onTrailerOpen,
}: {
  game: HeroCarouselGame;
  trailerEmbed: string | null;
  onPlay?: (id: string) => void;
  onAddToWishlist?: (id: string) => void;
  onTrailerOpen: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end px-6 pb-12 pt-16 sm:px-10 sm:pb-14 lg:px-16 lg:pb-16">
      <motion.div 
        className="space-y-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {game.tags && game.tags.length > 0 ? <HeroTagList tags={game.tags} /> : null}
        <motion.h1 
          className="max-w-3xl text-[1.875rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[3rem]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {game.title}
        </motion.h1>
        <motion.p 
          className="mt-4 line-clamp-2 max-w-xl text-sm leading-relaxed text-[#b8b8b8] sm:text-base"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {game.description}
        </motion.p>
        <motion.div 
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <motion.button 
            type="button" 
            onClick={() => onPlay?.(game.id)} 
            className="store-btn-primary inline-flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Play size={18} fill="currentColor" />
            Get
          </motion.button>
          {trailerEmbed ? (
            <motion.button 
              type="button" 
              onClick={onTrailerOpen} 
              className="store-btn-secondary inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Film size={18} />
              Trailer
            </motion.button>
          ) : null}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href={`/games/${game.slug}`} className="store-btn-secondary">
              Learn more
            </Link>
          </motion.div>
          <motion.button
            type="button"
            onClick={() => onAddToWishlist?.(game.id)}
            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-sky-400/30 bg-sky-500/15 text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            aria-label="Add to wishlist"
            whileHover={{ scale: 1.1, boxShadow: '0 0 30px rgba(56, 189, 248, 0.4)' }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart size={19} />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function HeroTagList({ tags }: { tags: string[] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag, index) => (
        <motion.span
          key={tag}
          className="rounded border border-white/12 bg-black/50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d4d4d4] backdrop-blur-md transition hover:border-white/20 hover:bg-black/60"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          whileHover={{ scale: 1.05 }}
        >
          {tag}
        </motion.span>
      ))}
    </div>
  );
}

function HeroThumbs({
  games,
  currentIndex,
  onSelect,
  thumbRefs,
}: {
  games: HeroCarouselGame[];
  currentIndex: number;
  onSelect: (i: number) => void;
  thumbRefs: React.MutableRefObject<Array<HTMLButtonElement | null>>;
}) {
  return (
    <aside className="hidden flex-col border-l border-[#3a3a3a] bg-[#121212] p-3 lg:flex">
      <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9e9e9e]">Featured</p>
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {games.map((item, index) => (
          <button
            ref={(el) => {
              thumbRefs.current[index] = el;
            }}
            key={`${item.id}-${item.slug}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'store-hero-thumb flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all duration-300',
              currentIndex === index && 'store-hero-thumb-active'
            )}
          >
            <img
              src={item.backgroundImage || FALLBACK_HERO}
              alt=""
              className="h-[56px] w-[96px] shrink-0 rounded-md object-cover shadow-sm"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_HERO;
              }}
            />
            <span className="line-clamp-2 text-xs font-semibold leading-snug text-[#f5f5f5]">{item.title}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}

function TrailerModal({ embedUrl, onClose }: { embedUrl: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div 
        className="absolute inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md" 
        role="dialog" 
        aria-modal="true"
        variants={modalBackdropVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div 
          className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-[#333] bg-black shadow-2xl"
          variants={modalContentVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <motion.button
            type="button"
            className="absolute right-3 top-3 z-[2] rounded bg-black/80 p-2 text-white hover:bg-black"
            onClick={onClose}
            aria-label="Close"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-5 w-5" />
          </motion.button>
          <div className="aspect-video w-full">
            <iframe
              title="Trailer"
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default HeroCarousel;
