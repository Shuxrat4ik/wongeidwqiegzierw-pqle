import type { Game } from '@/lib/supabase';

const GAME_WRITE_KEYS = [
  'title',
  'slug',
  'description',
  'short_description',
  'cover_image',
  'banner_image',
  'screenshots',
  'videos',
  'trailer_url',
  'genre',
  'tags',
  'developer',
  'publisher',
  'release_date',
  'platform',
  'rating',
  'review_count',
  'price',
  'discount_percent',
  'affiliate_url',
  'download_url',
  'download_path',
  'system_requirements',
] as const;

type GameWriteKey = (typeof GAME_WRITE_KEYS)[number];

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

/** Strips unknown keys so PostgREST insert/update never fails on stray JSON fields. */
export function sanitizeGameInsert(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};

  for (const key of GAME_WRITE_KEYS) {
    const val = body[key];
    if (val === undefined) continue;

    if (key === 'screenshots' || key === 'genre' || key === 'tags' || key === 'platform') {
      out[key] = asStringArray(val);
      continue;
    }

    if (key === 'trailer_url' || key === 'affiliate_url' || key === 'download_url' || key === 'download_path') {
      out[key] = val === '' ? null : val;
      continue;
    }

    if (key === 'system_requirements') {
      out[key] = val && typeof val === 'object'
        ? JSON.parse(JSON.stringify(val))
        : val;
      continue;
    }

    out[key] = val;
  }

  return out;
}

export function sanitizeGamePatch(body: Record<string, unknown>): Record<string, unknown> {
  const { id: _id, ...rest } = body;
  return sanitizeGameInsert(rest);
}

export function defaultSystemRequirements(): Game['system_requirements'] {
  return {
    minimum: {
      os: 'Windows 10 64-bit',
      cpu: 'Intel Core i5',
      ram: '8 GB',
      gpu: 'NVIDIA GTX 1060',
      storage: '30 GB',
    },
    recommended: {
      os: 'Windows 11 64-bit',
      cpu: 'Intel Core i7',
      ram: '16 GB',
      gpu: 'NVIDIA RTX 3060',
      storage: '30 GB SSD',
    },
  };
}
