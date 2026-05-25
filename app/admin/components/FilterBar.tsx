'use client';

import { Search, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: 'title' | 'price-asc' | 'price-desc' | 'rating' | 'date';
  onSortChange: (value: 'title' | 'price-asc' | 'price-desc' | 'rating' | 'date') => void;
  filters: {
    genre?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    availability?: 'all' | 'available' | 'unavailable';
  };
  onFilterChange: (filters: any) => void;
  allGenres: string[];
}

export function FilterBar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  filters,
  onFilterChange,
  allGenres,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeFilters = Object.values(filters).filter(v => v !== undefined && v !== 'all' && v !== '').length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search games by title, developer..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="relative w-40">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="w-full appearance-none rounded-lg border border-input bg-background py-2 pl-4 pr-10 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="title">Sort by Title (A-Z)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Rating: Highest First</option>
            <option value="date">Newest First</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={cn(
            'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
            activeFilters > 0
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-input bg-background hover:border-primary/50'
          )}
        >
          Filters
          {activeFilters > 0 && (
            <span className="ml-2 inline-block rounded-full bg-primary text-white px-2 py-0.5 text-xs">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-input bg-muted/30 p-4 md:grid-cols-5">
          {/* Genre Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Genre</label>
            <select
              value={filters.genre || ''}
              onChange={(e) => onFilterChange({ ...filters, genre: e.target.value || undefined })}
              className="w-full appearance-none rounded border border-input bg-background py-1.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">All Genres</option>
              {allGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Min Price</label>
            <input
              type="number"
              placeholder="$0"
              min="0"
              step="5"
              value={filters.minPrice ?? ''}
              onChange={(e) =>
                onFilterChange({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full rounded border border-input bg-background py-1.5 px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Max Price */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Max Price</label>
            <input
              type="number"
              placeholder="$100"
              min="0"
              step="5"
              value={filters.maxPrice ?? ''}
              onChange={(e) =>
                onFilterChange({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full rounded border border-input bg-background py-1.5 px-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Min Rating */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Min Rating</label>
            <select
              value={filters.minRating ?? ''}
              onChange={(e) =>
                onFilterChange({ ...filters, minRating: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              className="w-full appearance-none rounded border border-input bg-background py-1.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Any Rating</option>
              <option value="3">3+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="5">5 Stars</option>
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Availability</label>
            <select
              value={filters.availability || 'all'}
              onChange={(e) => onFilterChange({ ...filters, availability: e.target.value as any })}
              className="w-full appearance-none rounded border border-input bg-background py-1.5 px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All</option>
              <option value="available">Available Only</option>
              <option value="unavailable">Unavailable Only</option>
            </select>
          </div>

          {/* Clear Filters */}
          {activeFilters > 0 && (
            <div className="flex items-end">
              <button
                onClick={() =>
                  onFilterChange({
                    genre: undefined,
                    minPrice: undefined,
                    maxPrice: undefined,
                    minRating: undefined,
                    availability: 'all',
                  })
                }
                className="w-full rounded bg-red-50 hover:bg-red-100 text-red-600 py-1.5 text-xs font-medium transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
