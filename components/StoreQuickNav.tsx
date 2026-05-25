'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Flame, Gamepad2, Gift, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Discover', icon: Gamepad2, match: 'home' as const },
  { href: '/games', label: 'Browse', icon: Sparkles, match: 'browse' as const },
  { href: '/games?sort=rating', label: 'Top sellers', icon: TrendingUp, match: 'rating' as const },
  { href: '/games?sort=newest', label: 'New', icon: Sparkles, match: 'newest' as const },
  { href: '/games?discount=true', label: 'Sales', icon: Flame, match: 'sale' as const },
  { href: '/games?maxPrice=0', label: 'Free', icon: Gift, match: 'free' as const },
];

function isLinkActive(
  match: (typeof links)[number]['match'],
  pathname: string,
  sort: string | null,
  discount: string | null,
  maxPrice: string | null
) {
  if (match === 'home') return pathname === '/';
  if (pathname !== '/games') return false;
  if (match === 'browse') return !sort && !discount && maxPrice !== '0';
  if (match === 'rating') return sort === 'rating';
  if (match === 'newest') return sort === 'newest';
  if (match === 'sale') return discount === 'true';
  if (match === 'free') return maxPrice === '0';
  return false;
}

export default function StoreQuickNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort');
  const discount = searchParams.get('discount');
  const maxPrice = searchParams.get('maxPrice');

  return (
    <nav aria-label="Store categories" className="store-quick-nav -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max items-center gap-2.5 pb-1">
        {links.map(({ href, label, icon: Icon, match }) => {
          const active = isLinkActive(match, pathname, sort, discount, maxPrice);
          return (
            <li key={href}>
              <Link href={href} className={cn('store-chip inline-flex items-center gap-2 whitespace-nowrap', active && 'store-chip-active')}>
                <Icon className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
