# Where Your Store Games Come From

## 📂 File Location
**`lib/top-games.ts`**

This is the ONLY source of games for your store.

---

## 📊 Game Data Structure

### Source: `lib/top-games.ts`

**Lines 58-120+:** Hand-curated list of 40+ real games

```typescript
const TOP_GAME_DATA: TopGameSeed[] = [
  { title: 'Counter-Strike 2', appId: 730, genre: [...], ... },
  { title: 'Dota 2', appId: 570, genre: [...], ... },
  { title: 'PUBG: BATTLEGROUNDS', appId: 578080, ... },
  // ... and 37 more real games
]
```

**Game List:**
- Counter-Strike 2
- Dota 2
- PUBG: BATTLEGROUNDS
- Apex Legends
- Grand Theft Auto V
- Rust
- Warframe
- Destiny 2
- Team Fortress 2
- War Thunder
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
- Monster Hunter Rise
- Stardew Valley
- Terraria
- Valheim
- Hades
- Hades II
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
- And 20+ more...

---

## 🔄 How Games Are Generated

### Step 1: Start with 40+ Real Games (TOP_GAME_DATA)
```typescript
const TOP_GAME_DATA: TopGameSeed[] = [
  { title: 'Counter-Strike 2', appId: 730, ... },
  // 40+ games total
]
```

### Step 2: Expand to 1,000 Games (CATALOG_SIZE)
```typescript
const CATALOG_SIZE = 1000;

export const TOP_GAME_SEEDS: Game[] = Array.from(
  { length: CATALOG_SIZE },  // Creates 1,000 games
  (_, index) => {
    const seed = TOP_GAME_DATA[index % TOP_GAME_DATA.length];
    // TOP_GAME_DATA cycles 25 times (1000 / 40)
    // Each cycle adds different editions/variants
  }
);
```

### Step 3: Create Variants with Edition Names
Each base game gets variants:
- Original (batch 0): "Counter-Strike 2"
- Edition 1: "Counter-Strike 2: Definitive Edition"
- Edition 2: "Counter-Strike 2: Ultimate Bundle"
- Edition 3: "Counter-Strike 2: Next-Gen Drop"
- And 7 more edition names...

**10 Edition Names:**
1. Definitive Edition
2. Ultimate Bundle
3. Next-Gen Drop
4. Night Ops
5. Legends Pack
6. Remastered Vault
7. Arena Cut
8. Collector Run
9. Champion Circuit
10. Launch Archive

---

## 🎯 Why This Design?

1. **Real Game Data:**
   - Uses actual Steam app IDs
   - Pulls real images from Steam CDN
   - Accurate metadata (release dates, genres, ratings)

2. **Scalable to 1,000:**
   - Start with 40 curated games
   - Expand to 1,000 without manual data entry
   - Creates realistic "editions" of games

3. **Store-Ready:**
   - Each game has all required fields
   - Prices, discounts, ratings
   - System requirements
   - Screenshots, videos, descriptions

---

## 🖼️ How Images Are Loaded

Games pull images from **Steam CDN**:
```
https://cdn.cloudflare.steamstatic.com/steam/apps/{appId}/{image_type}
```

**Image Types:**
- Header: `header.jpg` (banner)
- Cover: `library_600x900.jpg` (cover art)
- Capsule: `capsule_616x353.jpg` (thumbnail)

All 40+ games have real images from Steam.

---

## 🎮 How Games Appear in Your Store

### On Homepage:
1. Top 12 games from `TOP_GAME_SEEDS` show in hero carousel
2. If featured_games table is empty, falls back to `TOP_GAME_SEEDS`
3. Each game displays with Steam images, ratings, prices

### In Admin:
Games come from TWO sources (in order):
1. **Primary:** Admin API → Supabase `games` table (if migrations applied)
2. **Fallback:** Direct Supabase query → `games` table
3. **If both fail:** No games shown (migrations not applied)

### In Homepage/Store:
Games come from TWO sources:
1. **Featured Games:** From `featured_games` table (if migrations applied)
2. **Fallback:** From `TOP_GAME_SEEDS` (always available, no DB needed)

---

## ❓ When Are Games From TOP_GAME_SEEDS Used?

**Always:**
- App startup (before DB loads)
- If Supabase is down
- If migrations not applied
- Related games suggestions
- If user searches offline

**Conditional:**
- If featured_games table is empty, use TOP_GAME_SEEDS as fallback
- If homepage load fails, show TOP_GAME_SEEDS

---

## 🚀 How to Use Your Own Game Data

### Option 1: Add to TOP_GAME_DATA
Edit `lib/top-games.ts` lines 58-120:
```typescript
const TOP_GAME_DATA: TopGameSeed[] = [
  // Add your game here
  { 
    title: 'My Game', 
    appId: 12345,  // Your Steam app ID
    genre: ['Action', 'RPG'],
    // ... other fields
  },
]
```

### Option 2: Use Supabase Database
1. Apply migrations (see QUICK_START.md)
2. Add games via admin panel
3. Games go into `games` table
4. Featured_games reference the database games

### Option 3: Bulk Import
Use the bulk migration files to add 200 or 1000 games:
- `supabase/migrations/20260515100002_bulk_200_catalog.sql`
- `supabase/migrations/20260515121000_bulk_1000_catalog.sql`

---

## 🔍 How to Find Specific Games

### In Code:
```typescript
// lib/top-games.ts
TOP_GAME_SEEDS.find(g => g.slug === 'counter-strike-2')
TOP_GAME_SEEDS.find(g => g.title.includes('Elden'))
```

### In App:
- Homepage: Search in store
- Admin: Scroll games table or use search
- Any game page: URL slug matches game slug

---

## 📝 Fields for Each Game

Every game in `TOP_GAME_SEEDS` includes:

```typescript
{
  id: 'seed-game-slug',           // Unique ID
  title: 'Game Name',              // Display name
  slug: 'game-name',               // URL-friendly
  description: 'Long description',
  short_description: 'Max 160 chars',
  cover_image: 'URL',             // From Steam CDN
  banner_image: 'URL',            // From Steam CDN
  screenshots: ['URL1', 'URL2', ...],  // 6+ images
  trailer_url: 'YouTube URL',
  videos: ['YouTube URLs'],
  genre: ['Action', 'RPG'],
  tags: ['Tag1', 'Tag2'],
  developer: 'Developer Name',
  publisher: 'Publisher Name',
  release_date: 'YYYY-MM-DD',
  platform: ['Windows'],
  rating: 4.5,                    // 0-5
  review_count: 1800,
  price: 59.99,
  discount_percent: 30,
  currency: 'USD',
  system_requirements: { ... },
  download_url: 'https://...',
  is_available: true,
}
```

---

## 🎯 Summary

| Aspect | Details |
|--------|---------|
| **File** | `lib/top-games.ts` |
| **Base Games** | 40+ curated real games |
| **Total Games** | 1,000 (expanded via editions) |
| **Images** | From Steam CDN |
| **Prices** | Real Steam prices |
| **Always Available** | Yes (no DB needed) |
| **Database Option** | Yes (with migrations) |

---

## 🚀 Next Steps

1. **View the file:** Open `lib/top-games.ts`
2. **Add your games:** Edit `TOP_GAME_DATA` array
3. **Or use database:** Apply migrations and add via admin
4. **Customize:** Modify images, prices, descriptions as needed
