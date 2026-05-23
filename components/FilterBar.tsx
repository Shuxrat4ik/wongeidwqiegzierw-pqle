'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  genre: string;
  onGenre: (v: string) => void;
  platform: string;
  onPlatform: (v: string) => void;
  priceFilter: string;
  onPriceFilter: (v: string) => void;
  sort: string;
  onSort: (v: string) => void;
  genres: string[];
  platforms: string[];
}

export default function FilterBar({
  search, onSearch, genre, onGenre, platform, onPlatform,
  priceFilter, onPriceFilter, sort, onSort, genres, platforms
}: FilterBarProps) {
  const hasFilters = search || genre || platform || priceFilter !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9e9e9e]" />
          <input
            type="text"
            placeholder="Search games, developers, tags..."
            value={search}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[#9e9e9e] focus:outline-none focus:border-[#0078f4] focus:ring-1 focus:ring-[#0078f4]/30 transition-all duration-200"
          />
          {search && (
            <button onClick={() => onSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e9e9e] hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <select
          value={genre}
          onChange={e => onGenre(e.target.value)}
          className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#0078f4] focus:ring-1 focus:ring-[#0078f4]/30 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>

        <select
          value={platform}
          onChange={e => onPlatform(e.target.value)}
          className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#0078f4] focus:ring-1 focus:ring-[#0078f4]/30 transition-all duration-200 cursor-pointer"
        >
          <option value="">All Platforms</option>
          {platforms.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={priceFilter}
          onChange={e => onPriceFilter(e.target.value)}
          className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#0078f4] focus:ring-1 focus:ring-[#0078f4]/30 transition-all duration-200 cursor-pointer"
        >
          <option value="all">All Prices</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
          <option value="discount">On Sale</option>
        </select>

        <select
          value={sort}
          onChange={e => onSort(e.target.value)}
          className="bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#0078f4] focus:ring-1 focus:ring-[#0078f4]/30 transition-all duration-200 cursor-pointer"
        >
          <option value="featured">Featured</option>
          <option value="rating">Top Rated</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="newest">Newest</option>
          <option value="discount">Biggest Discount</option>
        </select>
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-[#9e9e9e]">Active filters:</span>
          {genre && (
            <button onClick={() => onGenre('')} className="text-xs font-medium bg-[#0078f4]/15 text-[#26bbff] px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-[#0078f4]/25 transition-colors">
              {genre} <X className="w-3 h-3" />
            </button>
          )}
          {platform && (
            <button onClick={() => onPlatform('')} className="text-xs font-medium bg-[#0078f4]/15 text-[#26bbff] px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-[#0078f4]/25 transition-colors">
              {platform} <X className="w-3 h-3" />
            </button>
          )}
          {priceFilter !== 'all' && (
            <button onClick={() => onPriceFilter('all')} className="text-xs font-medium bg-[#0078f4]/15 text-[#26bbff] px-2.5 py-1 rounded-md flex items-center gap-1.5 hover:bg-[#0078f4]/25 transition-colors">
              {priceFilter === 'free' ? 'Free' : priceFilter === 'paid' ? 'Paid' : 'On Sale'} <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => { onSearch(''); onGenre(''); onPlatform(''); onPriceFilter('all'); onSort('featured'); }}
            className="text-xs font-medium text-[#9e9e9e] hover:text-white transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
