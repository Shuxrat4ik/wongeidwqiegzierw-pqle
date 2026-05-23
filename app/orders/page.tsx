'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Receipt, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

type OrderRow = {
  id: string;
  total: number;
  currency: string;
  status: string;
  created_at: string;
  order_items?: Array<{
    id: string;
    game_title: string;
    price_at_purchase: number;
  }>;
};

export default function OrdersPage() {
  const { user, session } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetch('/api/orders?pageSize=20', {
      headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not load orders');
        setOrders(data.orders ?? []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session?.access_token, user]);

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-white">
        <h1 className="text-3xl font-black">Orders</h1>
        <p className="mt-3 text-slate-400">Sign in to view your purchase history.</p>
        <Link href="/auth" className="mt-6 inline-flex rounded-full bg-sky-500 px-5 py-2 font-bold text-white">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 text-white">
      <div className="mb-8 flex items-center gap-3">
        <Receipt className="h-7 w-7 text-sky-400" />
        <h1 className="text-3xl font-black">Order history</h1>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-9 w-9 animate-spin text-sky-400" />
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-8 text-center">
          <p className="text-slate-400">No purchases yet.</p>
          <Link href="/games" className="mt-4 inline-flex rounded-full bg-sky-500 px-5 py-2 font-bold text-white">
            Browse games
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-xl border border-white/10 bg-[#1a1a1a] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{new Date(order.created_at).toLocaleString()}</p>
                  <h2 className="mt-1 font-bold">Order {order.id.slice(0, 8)}</h2>
                </div>
                <div className="text-right">
                  <p className="font-black">{order.currency} {Number(order.total).toFixed(2)}</p>
                  <span className="text-xs uppercase tracking-wide text-sky-300">{order.status}</span>
                </div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                {(order.order_items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 py-1 text-sm text-slate-300">
                    <span>{item.game_title}</span>
                    <span>{Number(item.price_at_purchase).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
