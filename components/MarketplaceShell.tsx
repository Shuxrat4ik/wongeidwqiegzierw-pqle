'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Download,
  Gamepad2,
  Heart,
  Home,
  Library,
  Search,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/games?sort=featured', label: 'Discover', icon: Sparkles },
  { href: '/games', label: 'Browse', icon: Search },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/downloads', label: 'Downloads', icon: Download },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const bottomItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/games', label: 'Browse', icon: Search },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
];

function isActive(pathname: string, href: string) {
  if (href.includes('?')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function MarketplaceShell() {
  const pathname = usePathname();

  return (
    <>
      {/* <aside className="fixed left-4 top-24 z-40 hidden w-[4.5rem] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-[#1a1a1a]/82 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={cn(
                'group relative flex h-12 w-12 items-center justify-center rounded-xl text-white/58 transition-all duration-200 hover:bg-white/10 hover:text-white',
                active && 'bg-[#3b82f6] text-white shadow-[0_0_24px_rgba(59,130,246,0.28)]'
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 rounded-lg border border-white/10 bg-[#1f1f1f] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-2xl transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </aside> */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#121212]/95 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-white/55 transition-colors',
                  active && 'bg-white/10 text-white'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
