# Setting Up Database Migrations

## Problem
You're seeing errors like: "Could not find the table 'public.profiles' in the schema cache"

This means the database migrations haven't been applied to your Supabase project yet.

## Solution: Apply Migrations via Supabase Dashboard

1. **Go to your Supabase project:**
   - URL: https://app.supabase.com
   - Select your project (zgcvgfjyfbvurzygpduy)

2. **Navigate to SQL Editor:**
   - Click the "SQL Editor" tab in the left sidebar

3. **Run migrations in order:**

   ### Migration 1: Main Schema (20260515100000_schema.sql)
   - Click "+ New Query"
   - Open file: `supabase/migrations/20260515100000_schema.sql`
   - Copy all content and paste into SQL Editor
   - Click "Run" button
   - Wait for success (should see green checkmark)

   ### Migration 2: Seed Data (20260515100001_seed.sql)
   - Click "+ New Query"
   - Open file: `supabase/migrations/20260515100001_seed.sql`
   - Copy all content and paste into SQL Editor
   - Click "Run" button
   - Wait for success

   ### Migration 3: Bulk Game Catalog (20260515100002_bulk_200_catalog.sql)
   - Click "+ New Query"
   - Open file: `supabase/migrations/20260515100002_bulk_200_catalog.sql`
   - Copy all content and paste into SQL Editor
   - Click "Run" button
   - Wait for success

   ### Migration 4: Add Videos Column (20260515120000_add_game_videos_column.sql)
   - Click "+ New Query"
   - Open file: `supabase/migrations/20260515120000_add_game_videos_column.sql`
   - Copy all content and paste into SQL Editor
   - Click "Run" button
   - Wait for success

4. **Verify it worked:**
   - Refresh your app
   - You should no longer see schema cache errors
   - Admin section should load properly
   - Homepage should display games and featured sections

## Alternative: Using Supabase CLI (requires installation)

If you prefer using the command line:

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref zgcvgfjyfbvurzygpduy

# Push all migrations
supabase db push
```

## Troubleshooting

If migrations fail:
- Check that you're running them in the correct order
- Check for duplicate table errors (try running the full schema migration)
- If stuck, clear all tables first (dangerous!) and restart

## What These Migrations Do

1. **schema.sql** - Creates all required tables:
   - profiles (user data)
   - games (game catalog)
   - featured_games (homepage sections)
   - cart, wishlist, library (user collections)
   - orders, transactions (payment system)
   - reviews (user ratings)
   - And more...

2. **seed.sql** - Adds initial test data

3. **bulk_200_catalog.sql** - Adds 200 example games

4. **add_game_videos_column.sql** - Adds videos support to games table
