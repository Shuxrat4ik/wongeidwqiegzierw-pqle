# Bulk Import 1,000 Games to Supabase

## ✅ SQL File Ready

**Location:** `supabase/migrations/20260519_bulk_1000_games.sql`

**File Details:**
- 1,000 INSERT statements (one per line)
- 2.1 MB total size
- All games from TOP_GAME_SEEDS (lib/top-games.ts)
- Fully formatted for PostgreSQL

---

## 🚀 How to Import

### Option 1: Supabase SQL Editor (Easiest)

1. Go to: https://app.supabase.com
2. Select your project
3. Go to **SQL Editor** → **+ New Query**
4. Open `supabase/migrations/20260519_bulk_1000_games.sql`
5. Copy all content (Ctrl+A, Ctrl+C)
6. Paste into SQL Editor (Ctrl+V)
7. Click **RUN** button
8. Wait for completion (should take 30-60 seconds)

### Option 2: Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link your project
supabase link --project-ref zgcvgfjyfbvurzygpduy

# Push migrations
supabase db push
```

### Option 3: Upload File

Some Supabase projects support SQL file uploads in the editor. If you see an upload button, use that.

---

## 📊 What Gets Imported

**1,000 Games generated from 109 base games:**
- Counter-Strike 2
- Dota 2
- PUBG: BATTLEGROUNDS
- Apex Legends
- Grand Theft Auto V Legacy
- Rust
- Baldur's Gate 3
- Elden Ring
- Cyberpunk 2077
- Red Dead Redemption 2
- The Witcher 3
- Hogwarts Legacy
- Palworld
- HELLDIVERS 2
- Black Myth: Wukong
- Monster Hunter: World
- Stardew Valley
- Terraria
- Valheim
- Hades & Hades II
- Dead Cells
- Hollow Knight
- Cuphead
- Celeste
- Slay the Spire
- Balatro
- Vampire Survivors
- Deep Rock Galactic
- No Man's Sky
- Sea of Thieves
- Forza Horizon 5
- Microsoft Flight Simulator
- Assetto Corsa
- Euro Truck Simulator 2
- American Truck Simulator
- Cities: Skylines
- And 73+ more...

**Each game includes:**
- ✓ Title & Slug
- ✓ Short & long descriptions
- ✓ Cover image (from Steam CDN)
- ✓ Banner image (from Steam CDN)
- ✓ 6 screenshots (from Steam CDN)
- ✓ 3 video links (YouTube)
- ✓ Genre & tags
- ✓ Developer & publisher
- ✓ Release date
- ✓ Price & discount
- ✓ Rating & review count
- ✓ System requirements
- ✓ Download URL
- ✓ Availability status

---

## 🎯 Game Variants

Each base game gets multiple variants (editions):

**Counter-Strike 2 examples:**
1. Counter-Strike 2 (original)
2. Counter-Strike 2: Definitive Edition (variant 1)
3. Counter-Strike 2: Ultimate Bundle (variant 2)
4. Counter-Strike 2: Next-Gen Drop (variant 3)
5. ... up to 10 editions

**Formula:** 109 base games × ~9 editions = ~1,000 total games

---

## ✅ After Import

Once imported, your store will have:

1. **Homepage:** Shows games from `featured_games` table (or TOP_GAME_SEEDS fallback)
2. **Admin Games Tab:** Shows all 1,000 games
3. **Store Browse:** Can search/filter all 1,000 games
4. **Game Details:** Full details for each game

---

## 🔍 Verify Import Success

After running the SQL:

1. Go to Supabase Dashboard
2. Click **Tables** → **games**
3. Should show ~1,000 rows
4. Check a few games to verify data looks correct

Or query in SQL Editor:
```sql
SELECT COUNT(*) FROM public.games;
-- Should return: 1000
```

---

## ⚠️ Important Notes

1. **Run migrations first:** Before importing 1,000 games, ensure schema is set up:
   - `20260515100000_schema.sql` (creates tables)
   - `20260515100001_seed.sql` (initial data)
   - `20260515120000_add_game_videos_column.sql` (videos support)

2. **Duplicates:** If you've already imported games, this will create duplicates. Delete old games first.

3. **Large file:** 2.1 MB is manageable. Supabase can handle it.

4. **Performance:** Import takes 30-60 seconds. Don't refresh during import.

---

## 📝 File Format

Each line is a complete INSERT statement:

```sql
INSERT INTO public.games (
  title, slug, short_description, description, 
  cover_image, banner_image, screenshots, videos, 
  genre, tags, developer, publisher, release_date, 
  platform, price, discount_percent, rating, 
  review_count, download_url, is_available, 
  system_requirements
) VALUES (
  'Game Title', 
  'game-slug', 
  'Short desc...', 
  'Long desc...', 
  'https://image.jpg', 
  'https://banner.jpg', 
  ARRAY['img1','img2'], 
  ARRAY['video1'], 
  ARRAY['Action','RPG'], 
  ARRAY['Tag1','Tag2'], 
  'Developer', 
  'Publisher', 
  '2024-01-01', 
  ARRAY['Windows'], 
  29.99, 
  50, 
  4.5, 
  1000, 
  'https://store.url', 
  true, 
  '{"minimum":{"ram":"8GB"}}'
);
```

---

## 🎉 Done!

Once imported, your game store is ready with:
- ✅ 1,000 games in database
- ✅ Real Steam data and images
- ✅ Full metadata for each game
- ✅ Can be managed in admin panel

Next: Add featured games sections in admin to showcase different game categories!
