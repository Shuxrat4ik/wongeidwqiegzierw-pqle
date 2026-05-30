'use client';

import Link from 'next/link';
import { CalendarDays, Heart, Library, LogIn, Receipt, Settings, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#121212] px-4 py-20 text-center text-white">Loading profile...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080a12] text-white">
        <main className="mx-auto max-w-[760px] px-4 py-20 sm:px-6 lg:px-8">
          <section className="rounded-lg border border-white/10 bg-[#1a1a1a] p-8 text-center">
            <User className="mx-auto mb-4 h-12 w-12 text-[#3b82f6]" />
            <h1 className="text-3xl font-black">Player profile</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#a0a0a0]">
              Sign in to see your account, library, wishlist, orders, and saved launcher settings.
            </p>
            <Link href="/auth" className="store-btn-primary mt-6 inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" /> Sign in
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const displayName = profile?.username || user.email?.split('@')[0] || 'Player';
  const createdAt = profile?.created_at || user.created_at;

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <main className="mx-auto max-w-[1050px] px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1a]">
          <div className="h-36 bg-[linear-gradient(135deg,#1f2937,#0f766e,#2563eb)]" />
          <div className="-mt-10 p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-white/15 bg-[#1f1f1f] text-2xl font-black shadow-2xl">
              {displayName[0]?.toUpperCase() || <User className="h-9 w-9 text-[#3b82f6]" />}
            </div>
            <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black">{displayName}</h1>
                <p className="mt-2 text-sm text-[#a0a0a0]">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.is_admin && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#22c55e]/15 px-3 py-2 text-xs font-black text-[#22c55e]">
                    <ShieldCheck className="h-4 w-4" /> Admin
                  </span>
                )}
                <button type="button" onClick={() => void signOut()} className="store-btn-secondary">Sign out</button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#1f1f1f] p-5">
            <CalendarDays className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <h2 className="font-bold">Member since</h2>
            <p className="mt-1 text-sm text-[#a0a0a0]">{formatDate(createdAt)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#1f1f1f] p-5">
            <ShieldCheck className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <h2 className="font-bold">Session</h2>
            <p className="mt-1 text-sm text-[#a0a0a0]">Signed in and synced</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#1f1f1f] p-5">
            <Settings className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <h2 className="font-bold">Launcher</h2>
            <p className="mt-1 text-sm text-[#a0a0a0]">Preferences saved locally</p>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { href: '/library', label: 'Library', icon: Library },
            { href: '/wishlist', label: 'Wishlist', icon: Heart },
            { href: '/orders', label: 'Purchases', icon: Receipt },
            { href: '/settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="rounded-lg border border-white/10 bg-[#1f1f1f] p-5 transition hover:border-[#3b82f6]/50">
                <Icon className="mb-4 h-5 w-5 text-[#3b82f6]" />
                <h2 className="font-bold">{item.label}</h2>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
