'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, HardDrive, Pause, Play, RotateCcw, ShieldCheck, Trash2, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { TOP_GAME_SEEDS } from '@/lib/top-games';

const DOWNLOADS_KEY = 'nexusvault:downloads:v1';

type DownloadStatus = 'ready' | 'downloading' | 'paused' | 'queued';
type DownloadItem = {
  id: string;
  title: string;
  image: string;
  sizeGb: number;
  speed: number;
  progress: number;
  status: DownloadStatus;
};

const initialQueue: DownloadItem[] = TOP_GAME_SEEDS.slice(0, 5).map((game, index) => ({
  id: game.id,
  title: game.title,
  image: game.banner_image || game.cover_image,
  sizeGb: [86, 42, 128, 12, 64][index] ?? 35,
  speed: index === 1 ? 38 : index === 2 ? 22 : 0,
  progress: index === 0 ? 100 : index === 1 ? 64 : index === 2 ? 28 : 0,
  status: index === 0 ? 'ready' : index === 1 || index === 2 ? 'downloading' : 'queued',
}));

function loadQueue() {
  try {
    const raw = window.localStorage.getItem(DOWNLOADS_KEY);
    const parsed = raw ? JSON.parse(raw) as DownloadItem[] : null;
    return Array.isArray(parsed) && parsed.length ? parsed : initialQueue;
  } catch {
    return initialQueue;
  }
}

export default function DownloadsPage() {
  const [queue, setQueue] = useState<DownloadItem[]>(initialQueue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setQueue(loadQueue());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(queue));
  }, [hydrated, queue]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQueue(prev => prev.map(item => {
        if (item.status !== 'downloading') return item;
        const nextProgress = Math.min(100, item.progress + Math.max(1, Math.round(item.speed / 12)));
        return { ...item, progress: nextProgress, status: nextProgress >= 100 ? 'ready' : 'downloading' };
      }));
    }, 1800);
    return () => window.clearInterval(timer);
  }, []);

  const activeDownloads = queue.filter(item => item.status === 'downloading');
  const totalReserved = queue.reduce((sum, item) => sum + item.sizeGb, 0);
  const bandwidth = activeDownloads.reduce((sum, item) => sum + item.speed, 0);
  const completed = queue.filter(item => item.status === 'ready').length;

  const nextQueued = useMemo(() => queue.find(item => item.status === 'queued'), [queue]);

  function updateItem(id: string, patch: Partial<DownloadItem>) {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }

  function startDownload(id: string) {
    const speed = 18 + Math.floor(Math.random() * 28);
    updateItem(id, { status: 'downloading', speed });
    toast.success('Download started');
  }

  function pauseDownload(id: string) {
    updateItem(id, { status: 'paused', speed: 0 });
    toast.info('Download paused');
  }

  function removeDownload(id: string) {
    setQueue(prev => prev.filter(item => item.id !== id));
    toast.info('Removed from queue');
  }

  function resetQueue() {
    setQueue(initialQueue);
    toast.success('Queue restored');
  }

  function startNextQueued() {
    if (!nextQueued) return toast.info('No queued downloads');
    startDownload(nextQueued.id);
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <main className="mx-auto max-w-[1300px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b82f6]">Launcher</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Downloads</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a0]">
              Manage installs, pause updates, remove queue items, and open games when they are ready.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetQueue} className="store-btn-secondary inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset queue
            </button>
            <Link href="/library" className="store-btn-primary inline-flex items-center gap-2">
              Open library <Play className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Bandwidth', value: `${bandwidth} MB/s`, icon: Wifi },
            { label: 'Ready builds', value: `${completed}/${queue.length}`, icon: ShieldCheck },
            { label: 'Disk reserved', value: `${totalReserved} GB`, icon: HardDrive },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
                <Icon className="mb-4 h-5 w-5 text-[#3b82f6]" />
                <div className="text-2xl font-black">{item.value}</div>
                <div className="mt-1 text-sm text-[#a0a0a0]">{item.label}</div>
              </div>
            );
          })}
        </section>

        <section className="mt-8 rounded-lg border border-white/10 bg-[#1a1a1a]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5">
            <h2 className="text-xl font-black">Install queue</h2>
            <button type="button" onClick={startNextQueued} className="store-btn-secondary inline-flex items-center gap-2 text-sm">
              <Download className="h-4 w-4" /> Start next
            </button>
          </div>
          <div className="divide-y divide-white/10">
            {queue.map((game, index) => (
              <div key={`${game.id}-${index}`} className="grid gap-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)_220px_140px] sm:items-center">
                <img src={game.image} alt="" className="h-16 w-24 rounded-lg object-cover" />
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{game.title}</h3>
                  <p className="mt-1 text-sm capitalize text-[#a0a0a0]">{game.status} · {game.sizeGb} GB</p>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-white/70">
                    <span>{game.progress}%</span>
                    <span>{game.status === 'downloading' ? `${game.speed} MB/s` : game.status === 'ready' ? 'Installed' : 'Waiting'}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[#3b82f6] transition-all" style={{ width: `${game.progress}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  {game.status === 'ready' ? (
                    <Link href="/library" className="rounded-lg bg-[#22c55e]/15 p-2 text-[#22c55e] transition hover:bg-[#22c55e]/25" aria-label="Open installed game">
                      <CheckCircle2 className="h-4 w-4" />
                    </Link>
                  ) : game.status === 'downloading' ? (
                    <button type="button" onClick={() => pauseDownload(game.id)} className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/15" aria-label="Pause download">
                      <Pause className="h-4 w-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={() => startDownload(game.id)} className="rounded-lg bg-[#3b82f6] p-2 text-white transition hover:bg-[#2563eb]" aria-label="Start download">
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" onClick={() => removeDownload(game.id)} className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-red-500/20 hover:text-red-300" aria-label="Remove download">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
