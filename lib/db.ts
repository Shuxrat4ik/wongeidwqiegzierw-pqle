// Database helper functions and types
import type { SupabaseClient } from '@supabase/supabase-js';

export type DbClient = SupabaseClient<any, 'public', any>;

export type Game = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  cover_image: string;
  banner_image: string;
  /** JSON array of image URLs from PostgREST */
  screenshots: string[];
  /** JSON array of video URLs from PostgREST */
  videos: string[];
  trailer_url: string | null;
  genre: string[];
  tags: string[];
  developer: string;
  publisher: string;
  release_date: string;
  platform: string[];
  rating: number;
  review_count: number;
  price: number;
  discount_percent: number;
  affiliate_url?: string | null;
  currency: string;
  system_requirements: Record<string, unknown>;
  download_url: string | null;
  download_path: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  is_owned?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
};

export type GameCard = Game & {
  categories?: Category[];
  is_owned?: boolean;
  is_wishlisted?: boolean;
  is_in_cart?: boolean;
  discount_price?: number;
};

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  bio: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  title: string;
  content: string;
  is_verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  profiles?: { username: string };
};

export type CartItem = {
  id: string;
  user_id: string;
  game_id: string;
  game?: Game;
  quantity: number;
  added_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  total_price: number;
  payment_status: 'pending' | 'paid';
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  game_id: string | null;
  game_title: string;
  price_at_purchase: number;
  discount_percent: number;
  created_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  raw_event: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FeaturedPlacement = 'hero' | 'trending' | 'new_release' | 'on_sale' | 'recommended';

export type FeaturedGame = {
  id: string;
  game_id: string;
  placement: FeaturedPlacement | string;
  sort_order: number;
  active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  games?: Game;
};

/**
 * PostgREST returns `numeric` columns as strings; UI code calls `.toFixed()` on prices/ratings.
 * Normalizes numbers and screenshot arrays so storefront components render safely.
 */
export function normalizeDbGameRow<G extends Record<string, unknown>>(row: G): G {
  const rawShots = row.screenshots;
  let screenshots: string[] = [];
  if (Array.isArray(rawShots)) {
    screenshots = rawShots.map((s) => (typeof s === 'string' ? s : String(s)));
  } else if (typeof rawShots === 'string' && rawShots.trim()) {
    try {
      const parsed = JSON.parse(rawShots) as unknown;
      if (Array.isArray(parsed)) screenshots = parsed.map(String);
    } catch {
      /* ignore */
    }
  }

  const rawVideos = (row as unknown as { videos?: unknown }).videos;
  let videos: string[] = [];
  if (Array.isArray(rawVideos)) {
    videos = rawVideos.map((v) => (typeof v === 'string' ? v : String(v)));
  } else if (typeof rawVideos === 'string' && rawVideos.trim()) {
    try {
      const parsed = JSON.parse(rawVideos) as unknown;
      if (Array.isArray(parsed)) videos = parsed.map(String);
    } catch {
      /* ignore */
    }
  }

  const n = (v: unknown, fallback = 0): number => {
    const x = Number(v);
    return Number.isFinite(x) ? x : fallback;
  };

  const strArray = (v: unknown): string[] => (Array.isArray(v) ? v.map((x) => String(x)) : []);

  return {
    ...row,
    price: n(row.price),
    rating: n(row.rating),
    discount_percent: Math.round(n(row.discount_percent)),
    review_count: Math.round(n(row.review_count)),
    screenshots,
    videos,
    genre: strArray(row.genre),
    tags: strArray(row.tags),
    platform: strArray(row.platform),
  } as G;
}

// Database query helpers
export async function fetchGames(
  supabase: DbClient,
  options?: {
    limit?: number;
    offset?: number;
    categoryIds?: string[];
    searchQuery?: string;
    sortBy?: 'featured' | 'newest' | 'rating' | 'price-low' | 'price-high';
    minPrice?: number;
    maxPrice?: number;
    onlyOnSale?: boolean;
  }
): Promise<{ games: GameCard[]; total: number }> {
  let gameIdsFilter: string[] | null = null;
  if (options?.categoryIds?.length) {
    const { data: links, error: linkErr } = await supabase
      .from('game_categories')
      .select('game_id')
      .in('category_id', options.categoryIds);
    if (linkErr) throw linkErr;
    gameIdsFilter = [...new Set((links ?? []).map((r) => r.game_id as string))];
    if (gameIdsFilter.length === 0) {
      return { games: [], total: 0 };
    }
  }

  let query = supabase.from('games').select('*', {
    count: 'exact',
  });

  if (gameIdsFilter) {
    query = query.in('id', gameIdsFilter);
  }

  if (options?.onlyOnSale) {
    query = query.gt('discount_percent', 0);
  }

  if (options?.searchQuery) {
    const q = options.searchQuery.replace(/%/g, '');
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  }

  if (options?.minPrice !== undefined && Number.isFinite(options.minPrice)) {
    query = query.gte('price', options.minPrice);
  }

  if (options?.maxPrice !== undefined && Number.isFinite(options.maxPrice)) {
    query = query.lte('price', options.maxPrice);
  }

  if (options?.sortBy === 'newest') {
    query = query.order('release_date', { ascending: false });
  } else if (options?.sortBy === 'rating') {
    query = query.order('rating', { ascending: false });
  } else if (options?.sortBy === 'price-low') {
    query = query.order('price', { ascending: true });
  } else if (options?.sortBy === 'price-high') {
    query = query.order('price', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset !== undefined && options?.limit) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const rows = (data as GameCard[]) || [];
  return {
    games: rows.map((r) => normalizeDbGameRow(r as unknown as Record<string, unknown>) as GameCard),
    total: count || 0,
  };
}

export async function fetchGameBySlug(
  supabase: DbClient,
  slug: string
): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select('*, game_categories(*, categories(*))')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return normalizeDbGameRow(data as unknown as Record<string, unknown>) as Game;
}

export async function fetchFeaturedGames(
  supabase: DbClient,
  placement?: FeaturedPlacement | string
): Promise<FeaturedGame[]> {
  // First query: Get featured_games with placement filter
  let query = supabase
    .from('featured_games')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  if (placement) {
    query = query.eq('placement', placement);
  }

  const { data: featuredRows, error: featuredError } = await query;

  if (featuredError) throw featuredError;

  if (!featuredRows || featuredRows.length === 0) {
    return [];
  }

  // Second query: Get games by game_id
  const gameIds = (featuredRows as FeaturedGame[]).map((r) => r.game_id);
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .in('id', gameIds);

  if (gamesError) throw gamesError;

  // Map games by ID
  const gamesMap = new Map(
    (games as Game[]).map((g) => [g.id, g])
  );

  // Merge featured_games with games
  return (featuredRows as FeaturedGame[]).map((row) => ({
    ...row,
    games: gamesMap.get(row.game_id)
      ? (normalizeDbGameRow(gamesMap.get(row.game_id)! as unknown as Record<string, unknown>) as Game)
      : undefined,
  }));
}

export async function fetchCategories(
  supabase: DbClient
): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return data as Category[];
}

export async function fetchUserProfile(
  supabase: DbClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data as UserProfile;
}

export async function fetchGameReviews(
  supabase: DbClient,
  gameId: string,
  limit = 20,
  offset = 0
): Promise<{ reviews: Review[]; total: number }> {
  const { data, error, count } = await supabase
    .from('reviews')
    .select('*', { count: 'exact' })
    .eq('game_id', gameId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return { reviews: [], total: count || 0 };
  }

  // Get profile data for all reviewers
  const userIds = data.map((r: { user_id: string }) => r.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profilesError) throw profilesError;

  // Map profiles by ID
  const profilesMap = new Map(
    (profiles || []).map((p: Record<string, unknown>) => [p.id, p])
  );

  // Merge reviews with profile data
  const reviews = data.map((r: { user_id: string } & Record<string, unknown>) => ({
    ...r,
    profiles: profilesMap.get(r.user_id),
  }));

  return {
    reviews: reviews as Review[],
    total: count || 0,
  };
}

export function calculateDiscountPrice(price: number, discount: number): number {
  if (discount <= 0 || discount >= 100) return price;
  return Math.round((price * (100 - discount)) / 100 * 100) / 100;
}

export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
}
