// Hook for managing user wishlist
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { readSeedCollection, SEED_COLLECTIONS_CHANGED, toggleSeedWishlist } from '@/lib/game-collections';
import { getTopGameById, isSeedGameId } from '@/lib/top-games';
import { isDatabaseGameId } from '@/lib/game-id';
import { toast } from 'sonner';

export function useWishlist() {
  const { userId, session } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Load wishlist
  const loadWishlist = useCallback(async () => {
    if (!userId || userId === 'guest') {
      setWishlistIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('game_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Wishlist query error:', error);
        throw error;
      }

      setWishlistIds(new Set([
        ...(data?.map((item) => item.game_id) || []),
        ...Array.from(readSeedCollection(userId, 'wishlist')),
      ]));
    } catch (error) {
      console.error('Failed to load wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    if (!userId || userId === 'guest') return;
    const refreshSeedWishlist = () => {
      setWishlistIds(prev => {
        const dbIds = Array.from(prev).filter(id => !isSeedGameId(id));
        return new Set([...dbIds, ...Array.from(readSeedCollection(userId, 'wishlist'))]);
      });
    };
    window.addEventListener(SEED_COLLECTIONS_CHANGED, refreshSeedWishlist);
    return () => window.removeEventListener(SEED_COLLECTIONS_CHANGED, refreshSeedWishlist);
  }, [userId]);

  const toggleWishlist = useCallback(
    async (gameId: string) => {
      if (!userId || userId === 'guest') {
        toast.error('Please sign in to use wishlist');
        return;
      }

      try {
        if (isSeedGameId(gameId)) {
          const seedGame = getTopGameById(gameId);
          if (!seedGame) {
            toast.error('Game not found');
            return;
          }
          const added = toggleSeedWishlist(userId, seedGame);
          setWishlistIds(prev => {
            const next = new Set(prev);
            if (added) next.add(gameId);
            else next.delete(gameId);
            return next;
          });
          if (added) toast.success('Added to wishlist');
          else toast.info('Removed from wishlist');
          return;
        }

        if (wishlistIds.has(gameId)) {
          // Remove from wishlist
          const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('user_id', userId)
            .eq('game_id', gameId);

          if (error) throw error;

          setWishlistIds(prev => {
            const next = new Set(prev);
            next.delete(gameId);
            return next;
          });
          toast.success('Removed from wishlist');
        } else {
          if (!isDatabaseGameId(gameId)) {
            console.warn('[wishlist:add] blocked invalid gameId:', gameId);
            toast.error('This game is not available for wishlist yet');
            return;
          }

          const res = await fetch('/api/wishlist/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token ?? ''}`,
            },
            body: JSON.stringify({ gameId }),
          });
          const payload = await res.json().catch(() => ({}));
          if (payload?.ok === false) {
            throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to add to wishlist');
          }
          if (!res.ok) {
            throw new Error(typeof payload.error === 'string' ? payload.error : 'Failed to add to wishlist');
          }

          setWishlistIds(prev => {
            const next = new Set(prev);
            next.add(gameId);
            return next;
          });
          toast.success('Added to wishlist');
        }
      } catch (error) {
        console.error('Failed to toggle wishlist:', error);
        toast.error('Failed to update wishlist');
      }
    },
    [userId, session?.access_token, wishlistIds]
  );

  const isWishlisted = useCallback((gameId: string) => {
    return wishlistIds.has(gameId);
  }, [wishlistIds]);

  return {
    wishlistIds,
    loading,
    toggleWishlist,
    isWishlisted,
    reload: loadWishlist,
  };
}
