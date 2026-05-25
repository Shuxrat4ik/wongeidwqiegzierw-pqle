'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import { Game } from '@/lib/supabase';

interface UseGameListOptions {
  games: Game[];
  pageSize?: number;
}

export function useGameList({ games, pageSize = 20 }: UseGameListOptions) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'price-asc' | 'price-desc' | 'rating' | 'date'>('title');
  const [filters, setFilters] = useState<{
    genre?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    availability?: 'all' | 'available' | 'unavailable';
  }>({
    availability: 'all',
  });

  // Reset to page 1 when search/filters change
  useEffect(() => {
    setPage(1);
  }, [search, sortBy, filters]);

  // Extract unique genres
  const allGenres = useMemo(() => {
    const genreSet = new Set<string>();
    games.forEach((game) => {
      game.genre?.forEach((g) => genreSet.add(g));
    });
    return Array.from(genreSet).sort();
  }, [games]);

  // Filter and sort games
  const filteredGames = useMemo(() => {
    let result = [...games];

    // Search
    if (search) {
      const query = search.toLowerCase();
      result = result.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.developer.toLowerCase().includes(query) ||
          game.publisher.toLowerCase().includes(query)
      );
    }

    // Genre filter
    if (filters.genre) {
      result = result.filter((game) => game.genre?.includes(filters.genre!));
    }

    // Price filter
    if (filters.minPrice !== undefined) {
      result = result.filter((game) => game.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((game) => game.price <= filters.maxPrice!);
    }

    // Rating filter
    if (filters.minRating !== undefined) {
      result = result.filter((game) => game.rating >= filters.minRating!);
    }

    // Availability filter
    if (filters.availability !== 'all') {
      if (filters.availability === 'available') {
        result = result.filter((game) => game.is_available);
      } else if (filters.availability === 'unavailable') {
        result = result.filter((game) => !game.is_available);
      }
    }

    // Sorting
    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'date':
        result.sort((a, b) => {
          const dateA = new Date(a.release_date).getTime();
          const dateB = new Date(b.release_date).getTime();
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [games, search, sortBy, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredGames.length / pageSize);
  const paginatedGames = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return filteredGames.slice(start, end);
  }, [filteredGames, page, pageSize]);

  return {
    games: paginatedGames,
    filteredGames,
    allGames: games,
    totalResults: filteredGames.length,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    sortBy,
    setSortBy,
    filters,
    setFilters,
    allGenres,
  };
}
