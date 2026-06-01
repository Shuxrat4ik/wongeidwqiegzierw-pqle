'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase, Game } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  ShoppingCart,
  Trash2,
  Loader2,
  ArrowRight,
  CreditCard,
  Check,
  Tag,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeDbGameRow } from '@/lib/db';
import { toast } from 'sonner';

// 🌍 REGION PRICING
function getRegionalPrice(price: number) {
  const country = 'MY'; // keyin dynamic qilamiz
  const map: Record<string, number> = {
    MY: 0.8,
    US: 1,
    IN: 0.5,
    UZ: 0.6,
  };
  return Math.round(price * (map[country] || 1) * 100) / 100;
}

type CartEntry = { id: string; game: Game };

export default function CartPage() {
  const { user, userId, session } = useAuth();

  const [items, setItems] = useState<CartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    if (!user || userId === 'guest') {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart')
      .select('id, game_id, games(*)')
      .eq('user_id', userId);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const mapped: CartEntry[] = (data ?? [])
      .filter((c: any) => c.games)
      .map((c: any) => ({
        id: c.id,
        game: normalizeDbGameRow(c.games),
      }));

    setItems(mapped);
    setLoading(false);
  }, [user, userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================= REMOVE =================
  async function removeFromCart(cartId: string, title: string) {
    setRemoving(cartId);

    const res = await fetch('/api/cart/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ cartItemId: cartId }),
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      toast.error(typeof payload.error === 'string' ? payload.error : 'Could not remove item');
      setRemoving(null);
      return;
    }

    setItems(prev => prev.filter(i => i.id !== cartId));
    toast.info(`${title} removed`);
    setRemoving(null);
  }

  // ================= STRIPE CHECKOUT =================
  async function checkout() {
    if (!user) return toast.error('Login required');
    if (items.length === 0) return toast.error('Cart empty');

    setCheckingOut(true);

    try {
      // ❗ Filter already owned
      const { data: owned } = await supabase
        .from('library')
        .select('game_id')
        .eq('user_id', userId);

      const ownedSet = new Set(owned?.map(g => g.game_id));

      const newItems = items.filter(i => !ownedSet.has(i.game.id));

      if (newItems.length === 0) {
        toast.info('Already owned');
        return;
      }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({
      items: newItems.map((i) => ({
        gameId: i.game.id,
        price: i.game.price, // 🔥 qo‘sh
      })),
        total_price: newItems.reduce((sum, i) => sum + i.game.price, 0), // 🔥 qo‘sh
      }),
    });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      if (!data.url) throw new Error('Checkout failed');

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  // ================= CALCULATIONS =================
  const subtotal = items.reduce(
    (sum, { game }) =>
      sum +
      getRegionalPrice(game.price) *
        (1 - game.discount_percent / 100),
    0
  );

  const savings = items.reduce(
    (sum, { game }) =>
      sum +
      (getRegionalPrice(game.price) *
        game.discount_percent) /
        100,
    0
  );

  // ================= UI =================
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin w-10 h-10 text-sky-500" />
      </div>
    );
  }

  if (checkedOut) {
    return (
      <div className="text-center py-20">
        <Check className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl text-white font-bold mb-2">
          Purchase Successful!
        </h1>
        <Link href="/library" className="text-blue-400 underline">
          Go to Library
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl text-white font-bold mb-6">
        Cart ({items.length})
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Cart empty</p>
          <Link href="/" className="text-blue-400 underline">
            Browse Games
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ITEMS */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ id, game }, index) => {
              const isFree = game.price === 0;

              const price =
                getRegionalPrice(game.price) *
                (1 - game.discount_percent / 100);

              return (
                <div
                  key={`${id}-${game.id}-${index}`}
                  className="flex justify-between rounded-2xl border border-white/10 bg-[#1f1f1f] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-[#3b82f6]/40"
                >
                  <div>
                    <h3 className="text-white font-bold">
                      {game.title}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {game.developer}
                    </p>
                  </div>

                  <div className="text-right">
                    {game.discount_percent > 0 && (
                      <span className="line-through text-gray-500 text-xs">
                        ${getRegionalPrice(game.price).toFixed(2)}
                      </span>
                    )}

                    <p className="text-white font-bold">
                      {isFree
                        ? 'FREE'
                        : `$${price.toFixed(2)}`}
                    </p>

                    <button
                      onClick={() =>
                        removeFromCart(id, game.title)
                      }
                      className="text-red-400 text-sm mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUMMARY */}
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#1a1a1a] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <h2 className="text-white font-bold mb-4">
              Summary
            </h2>

            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {savings > 0 && (
              <div className="flex justify-between text-green-400 text-sm mt-2">
                <span>You save</span>
                <span>-${savings.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-[#2a2a2a] mt-4 pt-4 flex justify-between text-white font-bold">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            <button
              onClick={checkout}
              disabled={checkingOut}
              className="mt-6 w-full rounded-full bg-[#3b82f6] py-3 font-bold text-white transition hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingOut ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
