import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Game = {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  cover_image: string;
  banner_image: string;
  screenshots: string[];
  /** JSON array of video URLs (YouTube watch/embed or direct mp4/webm/ogg). */
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
  download_url: string | null;
  download_path?: string | null;
  system_requirements: SystemRequirements;
  is_available?: boolean;
  created_at: string;
  updated_at?: string;
};

export type SystemRequirements = {
  minimum?: SysReqLevel;
  recommended?: SysReqLevel;
};

export type SysReqLevel = {
  os: string;
  cpu: string;
  ram: string;
  gpu: string;
  storage: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  game_id: string;
  created_at: string;
  games?: Game;
};

export type CartItem = {
  id: string;
  user_id: string;
  game_id: string;
  added_at: string;
  games?: Game;
};

export type LibraryItem = {
  id: string;
  user_id: string;
  game_id: string;
  acquired_at: string;
  games?: Game;
};

export type Review = {
  id: string;
  user_id: string;
  game_id: string;
  rating: number;
  title: string;
  content: string;
  created_at: string;
  profiles?: { username: string };
};

export type Order = {
  id: string;
  user_id: string;
  subtotal?: number;
  total: number;
  total_price?: number;
  payment_status?: 'pending' | 'paid';
  status: string;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  created_at: string;
  order_items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  game_id: string | null;
  game_title: string;
  price_at_purchase: number;
  discount_percent?: number;
  games?: Pick<Game, 'title' | 'cover_image'>;
};

export type FeaturedGame = {
  id: string;
  game_id: string;
  placement: string;
  sort_order: number;
  active: boolean;
  start_date?: string;
  end_date?: string | null;
  created_at?: string;
  updated_at?: string;
  games?: Game;
};

export function formatPrice(price: number, discountPercent: number = 0): string {
  if (price === 0) return 'FREE';
  if (discountPercent > 0) {
    const discounted = price * (1 - discountPercent / 100);
    return `$${discounted.toFixed(2)}`;
  }
  return `$${price.toFixed(2)}`;
}

export function originalPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}
