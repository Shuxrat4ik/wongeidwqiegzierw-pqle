'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, Game } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { Library, Download, Play, Search, Loader as Loader2, ArrowRight, Star, Gamepad2, LogIn } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { normalizeDbGameRow } from '@/lib/db';
import { startVerifiedDownload } from '@/lib/game-download-client';
import { isSeedGameId } from '@/lib/top-games';
import { openGameSite, seedCollectionGames, SEED_COLLECTIONS_CHANGED } from '@/lib/game-collections';

type LibraryEntry = { id: string; game: Game; acquired_at: string };

export default function LibraryPage() {
  const { user, userId, session } = useAuth();
  const [items, setItems] = useState<LibraryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    if (!user || userId === 'guest') {
      setItems([]);
      setLoading(false);
      return 0;
    }

    const res = await fetch('/api/library', {
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
      cache: 'no-store',
    });
    const payload = await res.json().catch(() => ({}));
    const mapped: LibraryEntry[] = res.ok
      ? ((payload.items ?? []) as Array<{ id: string; acquired_at: string; game: Record<string, unknown> }>)
          .filter((item) => item.game)
          .map((item) => ({
            id: item.id,
            game: normalizeDbGameRow(item.game) as Game,
            acquired_at: item.acquired_at,
          }))
      : [];
    const seedItems: LibraryEntry[] = seedCollectionGames(userId, 'library').map(game => ({ id: `seed:${game.id}`, game, acquired_at: game.created_at }));
    const nextItems = [...mapped, ...seedItems];
    setItems(nextItems);
    setLoading(false);
    return nextItems.length;
  }, [userId, user, session?.access_token]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.location.search.includes('checkout=success')) return;
    let cancelled = false;
    let attempts = 0;

    const pollLibrary = async () => {
      attempts += 1;
      const count = await fetchData();
      if (!cancelled && count === 0 && attempts < 8) {
        window.setTimeout(pollLibrary, 1500);
      }
    };

    void pollLibrary();
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  useEffect(() => {
    const refresh = () => {
      const seedItems: LibraryEntry[] = seedCollectionGames(userId, 'library').map(game => ({ id: `seed:${game.id}`, game, acquired_at: game.created_at }));
      setItems(prev => [...prev.filter(item => !item.id.startsWith('seed:')), ...seedItems]);
    };
    window.addEventListener(SEED_COLLECTIONS_CHANGED, refresh);
    return () => window.removeEventListener(SEED_COLLECTIONS_CHANGED, refresh);
  }, [userId]);

  const filteredItems = items.filter(({ game }) =>
    !search ||
    game.title.toLowerCase().includes(search.toLowerCase()) ||
    (game.genre ?? []).some((g) => g.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-sky-500 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center"><Library className="w-5 h-5 text-sky-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Library</h1>
            <p className="text-slate-400 text-sm">{items.length} {items.length === 1 ? 'game' : 'games'} owned</p>
          </div>
        </div>
        {items.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search library..." value={search} onChange={e => setSearch(e.target.value)} className="bg-[#080a12] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white/70 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 w-64" />
          </div>
        )}
      </div>

      {!user && (
        <div className="text-center py-16 rounded-2xl bg-[#1a1a1a] border border-white/5 mb-6">
          <LogIn className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-3">Sign in to view your library</p>
          <Link href="/auth" className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors text-sm">Sign In</Link>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-24 rounded-2xl bg-[#0A0E17] border border-white/5">
          <Gamepad2 className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Your library is empty</h2>
          <p className="text-slate-400 mb-6">Purchase or download free games to see them here</p>
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors">Browse Store <ArrowRight className="w-4 h-4" /></Link>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16"><p className="text-slate-400">No games match your search</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(({ id, game, acquired_at }, index) => {
            const isFree = game.price === 0;
            const isSeed = isSeedGameId(game.id);
            const stars = Math.round(game.rating);
            return (
              <div key={`${id}-${game.id}-${index}`} className="bg-[#0B0F19] rounded-xl border border-white/5 hover:border-sky-500/20 transition-colors overflow-hidden group game-card">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <img src={game.banner_image} alt={game.title} className="w-full h-full bg-black object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="cover-gradient absolute inset-0" />
                  <div className="absolute bottom-2 left-2"><span className="badge-owned text-white text-xs font-bold px-2 py-0.5 rounded-md">Owned</span></div>
                </div>
                <div className="p-4">
                  <Link href={`/games/${game.slug}`}><h3 className="font-bold text-white mb-1 group-hover:text-sky-300 transition-colors leading-tight">{game.title}</h3></Link>
                  <p className="text-slate-500 text-xs mb-2">{game.developer}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={cn('w-3 h-3', i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-600')} />)}</div>
                    <span className="text-xs text-slate-400">{game.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">{(game.genre ?? []).slice(0, 2).map(g => <span key={g} className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded">{g}</span>)}</div>
                  <p className="text-slate-600 text-xs mb-3">Acquired {formatDate(acquired_at)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSeed) openGameSite(game);
                      else void startVerifiedDownload(supabase, game.slug);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    {isFree ? <><Download className="w-3.5 h-3.5" /> Download</> : <><Play className="w-3.5 h-3.5 fill-current" /> Play Now</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
