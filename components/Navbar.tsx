'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Download, Heart, Library, LogOut, Menu, Receipt, Search, Settings, Shield, ShoppingCart, User, Users, X } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import type { FormEvent, KeyboardEvent } from 'react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { useMounted } from '@/hooks/useMounted';
import { readSeedCollection, SEED_COLLECTIONS_CHANGED } from '@/lib/game-collections';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, userId } = useAuth();
  const mounted = useMounted();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!mounted || !user || userId === 'guest') {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }
    async function fetchCounts() {
      const [cartRes, wishRes] = await Promise.all([
        supabase.from('cart').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('wishlist').select('id', { count: 'exact' }).eq('user_id', userId),
      ]);
      setCartCount(cartRes.count ?? 0);
      setWishlistCount((wishRes.count ?? 0) + readSeedCollection(userId, 'wishlist').size);
    }
    fetchCounts();
  }, [pathname, user, userId, mounted]);

  useEffect(() => {
    if (!mounted || !user || userId === 'guest') return;
    const syncSeedCounts = async () => {
      const wishRes = await supabase.from('wishlist').select('id', { count: 'exact' }).eq('user_id', userId);
      setWishlistCount((wishRes.count ?? 0) + readSeedCollection(userId, 'wishlist').size);
    };
    const refreshSeedCounts = () => {
      void syncSeedCounts();
    };
    window.addEventListener(SEED_COLLECTIONS_CHANGED, refreshSeedCounts);
    return () => window.removeEventListener(SEED_COLLECTIONS_CHANGED, refreshSeedCounts);
  }, [mounted, user, userId]);

  const navLinks = [
    { href: '/', label: 'Discover' },
    { href: '/games', label: 'Browse' },
    { href: '/news', label: 'News' },
  ];

  const mobileLinks = [
    { href: '/', label: 'Discover' },
    { href: '/games', label: 'Browse' },
    { href: '/library', label: 'Library' },
    { href: '/wishlist', label: 'Wishlist' },
    { href: '/friends', label: 'Friends' },
    { href: '/downloads', label: 'Downloads' },
    { href: '/settings', label: 'Settings' },
  ];

  const runSearch = () => {
    const q = query.trim();
    if (!q) return;
    setMobileOpen(false);
    router.push(`/games?q=${encodeURIComponent(q)}`);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch();
  };

  const submitSearchFromKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    runSearch();
  };

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300',
        scrolled
          ? 'border-white/10 bg-[#121212]/94 shadow-[0_18px_50px_rgba(0,0,0,0.32)]'
          : 'border-white/5 bg-[#121212]/58'
      )}
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-3">
          <BrandLogo size="md" compact className="min-w-0 shrink" />

          <div className="hidden min-w-0 shrink-0 md:flex md:justify-center">
            <div className="flex max-w-full items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'relative px-4 py-2 text-sm font-medium transition-colors after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:rounded-full after:bg-[#3b82f6] after:transition-all after:duration-200',
                  pathname === href ? 'after:opacity-100 after:scale-x-100' : 'after:opacity-0 after:scale-x-75 hover:after:opacity-60 hover:after:scale-x-100',
                  pathname === href
                    ? 'text-white'
                    : 'text-white/58 hover:text-white'
                )}
              >
                {label}
              </Link>
            ))}
            {profile?.is_admin && (
              <Link
                href="/admin"
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
                  pathname.startsWith('/admin')
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-amber-400/70 hover:text-amber-400 hover:bg-amber-500/10'
                )}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            </div>
          </div>

          <form onSubmit={submitSearch} className="hidden min-w-[220px] max-w-xl flex-1 lg:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/42" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={submitSearchFromKey}
                placeholder="Search store"
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-11 text-sm text-white outline-none transition focus:border-[#3b82f6] focus:bg-white/[0.09] focus:ring-2 focus:ring-[#3b82f6]/20"
              />
              <button
                type="submit"
                aria-label="Search store"
                className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-white/58 transition hover:bg-white/10 hover:text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2">
            {/* <Link
              href="/downloads"
              className="hidden items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-bold text-black transition hover:bg-[#e6e6e6] xl:inline-flex"
            >
              <Download className="h-4 w-4" />
              Download
            </Link> */}
            {mounted && (
              <>
                <Link
                  href="/wishlist"
                  className="relative rounded-full p-2 text-white/62 transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  <Heart className="w-5 h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/cart"
                  className="relative rounded-full p-2 text-white/62 transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            {!mounted && (
              <>
                <div className="p-2"><Heart className="w-5 h-5 text-white/50" /></div>
                <div className="p-2"><ShoppingCart className="w-5 h-5 text-white/50" /></div>
              </>
            )}

            {mounted && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 transition-all duration-200 hover:bg-white/16"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3b82f6] text-xs font-bold text-white">
                    {(profile?.username || user.email || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-white font-medium hidden sm:block max-w-[100px] truncate">
                    {profile?.username || user.email?.split('@')[0]}
                  </span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1f1f1f] py-2 shadow-2xl">
                      <div className="border-b border-white/10 px-4 py-3">
                        <p className="text-sm font-medium text-white truncate">{profile?.username || user.email}</p>
                        <p className="truncate text-xs text-white/55">{user.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <User className="w-4 h-4" /> Profile
                      </Link>
                      <Link
                        href="/library"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Library className="w-4 h-4" /> My Library
                      </Link>
                      <Link
                        href="/friends"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Users className="w-4 h-4" /> Friends
                      </Link>
                      <Link
                        href="/downloads"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Download className="w-4 h-4" /> Downloads
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Receipt className="w-4 h-4" /> Orders
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/62 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      {profile?.is_admin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : mounted && !user ? (
              <Link
                href="/auth"
                className="flex items-center gap-2 rounded-full bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#2563eb]"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            ) : (
              <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
            )}

            <button
              className="rounded-md p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-1 border-t border-white/10 bg-[#121212] px-4 py-3 md:hidden">
          <form onSubmit={submitSearch} className="mb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={submitSearchFromKey}
                placeholder="Search store"
                className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.06] pl-9 pr-11 text-sm text-white outline-none focus:border-[#3b82f6]"
              />
              <button
                type="submit"
                aria-label="Search store"
                className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/58 transition hover:bg-white/10 hover:text-white"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          {mobileLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
                pathname === href ? 'bg-white/10 text-white' : 'text-white/62 hover:bg-white/10 hover:text-white'
              )}
            >
              {label}
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2.5 rounded-md text-sm font-medium text-amber-400 hover:bg-amber-500/10"
            >
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
