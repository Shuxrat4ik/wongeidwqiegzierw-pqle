'use client';

import Link from 'next/link';
import { useId } from 'react';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  /** Hides the subtitle for tighter headers (e.g. main nav). */
  compact?: boolean;
};

const sizes = {
  sm: { mark: 'h-8 w-8', text: 'text-base', sub: 'text-[9px]' },
  md: { mark: 'h-9 w-9', text: 'text-lg', sub: 'text-[10px]' },
  lg: { mark: 'h-11 w-11', text: 'text-xl sm:text-2xl', sub: 'text-[11px]' },
};

export default function BrandLogo({ className, size = 'md', href = '/', compact = false }: BrandLogoProps) {
  const gid = useId().replace(/:/g, '');
  const gradId = `nv-mark-${gid}`;
  const s = sizes[size];
  return (
    <Link href={href} className={cn('outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 rounded-lg', className)}>
      <span className="group flex items-center gap-2.5">
        <span
          className={cn(
            'relative flex shrink-0 items-center justify-center rounded bg-[#1a1a1a] ring-1 ring-[#333333]',
            s.mark
          )}
          aria-hidden
        >
          <svg viewBox="0 0 32 32" className="h-[55%] w-[55%]" fill="none">
            <defs>
              <linearGradient id={gradId} x1="4" y1="28" x2="28" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0078f2" />
                <stop offset="0.55" stopColor="#26bbff" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <path
              d="M6 26V6l10 9 10-9v20l-6-5.5V14.5L16 20 12 17.2V26H6z"
              fill={`url(#${gradId})`}
              className="transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </svg>
        </span>
        <span className="flex min-w-0 flex-col leading-none">
          <span className={cn('font-semibold tracking-tight text-white', s.text)}>
            Nexus<span className="text-[#26bbff]">Vault</span>
          </span>
          {!compact && (
            <span className={cn('mt-0.5 font-medium uppercase tracking-[0.22em] text-slate-500', s.sub)}>Game Store</span>
          )}
        </span>
      </span>
    </Link>
  );
}
