// Hook for managing user cart
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { CartItem, normalizeDbGameRow } from '@/lib/db';
import { isSeedGameId } from '@/lib/top-games';
import { isDatabaseGameId } from '@/lib/game-id';
import { toast } from 'sonner';

export function useCart() {
  const { userId, session } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Load cart items
  const loadCart = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setItems([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const { data: cartRows, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId);

      if (cartError) throw cartError;

      if (!cartRows || cartRows.length === 0) {
        setItems([]);
        setTotal(0);
        return;
      }

      // Get game details for all cart items
      const gameIds = cartRows.map((item: { game_id: string }) => item.game_id);
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .in('id', gameIds);

      if (gamesError) throw gamesError;

      // Map games by ID
      const gamesMap = new Map(
        (games || []).map((g: Record<string, unknown>) => [g.id, g])
      );

      // Merge cart items with game data
      const rows = cartRows.map((item: { game_id: string } & Record<string, unknown>) => {
        const game = gamesMap.get(item.game_id)
          ? (normalizeDbGameRow(gamesMap.get(item.game_id) as Record<string, unknown>) as CartItem['game'])
          : undefined;
        return { ...item, game } as CartItem;
      });

      setItems(rows);

      // Calculate total
      const cartTotal = rows.reduce((sum, item) => {
        const price = item.game?.price || 0;
        const discounted = price * (1 - (item.game?.discount_percent || 0) / 100);
        return sum + discounted * item.quantity;
      }, 0);
      setTotal(Math.round(cartTotal * 100) / 100);
    } catch (error) {
      console.error('Failed to load cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = useCallback(
    async (gameId: string) => {
      if (!userId || userId === 'guest') {
        toast.error('Please sign in to add to cart');
        return;
      }

      try {
        if (isSeedGameId(gameId)) {
          toast.info('This game opens from its official store page');
          return;
        }

        if (!isDatabaseGameId(gameId)) {
          console.warn('[cart:add] blocked invalid gameId:', gameId);
          toast.error('This game is not available for cart yet');
          return;
        }

        if (items.some((item) => item.game_id === gameId)) {
          toast.info('Already in cart');
          return;
        }

        const res = await fetch('/api/cart/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ gameId }),
        });
        const payload = await res.json().catch(() => ({}));
        if (payload?.ok === false) {
          toast.error(typeof payload.error === 'string' ? payload.error : 'Failed to add to cart');
          return;
        }
        if (res.status === 409) {
          toast.info(typeof payload.error === 'string' ? payload.error : 'Already in cart');
          return;
        }
        if (!res.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to add to cart');

        toast.success('Added to cart');
        await loadCart();
      } catch (error) {
        console.error('Failed to add to cart:', error);
        toast.error('Failed to add to cart');
      }
    },
    [items, userId, session?.access_token, loadCart]
  );

  const removeFromCart = useCallback(
    async (cartItemId: string) => {
      try {
        const res = await fetch('/api/cart/remove', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
          },
          body: JSON.stringify({ cartItemId }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to remove from cart');

        toast.success('Removed from cart');
        await loadCart();
      } catch (error) {
        console.error('Failed to remove from cart:', error);
        toast.error('Failed to remove from cart');
      }
    },
    [session?.access_token, loadCart]
  );

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(cartItemId);
        return;
      }

      try {
        const { error } = await supabase
          .from('cart')
          .update({ quantity })
          .eq('id', cartItemId);

        if (error) throw error;
        await loadCart();
      } catch (error) {
        console.error('Failed to update quantity:', error);
        toast.error('Failed to update quantity');
      }
    },
    [loadCart, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    if (!userId || userId === 'guest') return;

    try {
      const { error } = await supabase.from('cart').delete().eq('user_id', userId);

      if (error) throw error;

      setItems([]);
      setTotal(0);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast.error('Failed to clear cart');
    }
  }, [userId]);

  return {
    items,
    total,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    reload: loadCart,
  };
}
