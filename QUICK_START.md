# Quick Start: Fix Schema Errors

## The Problem
You're seeing errors like:
- "Could not find the table 'public.profiles' in the schema cache"
- "Could not find a relationship between featured_games and games"

## The Solution (5 minutes)

### Step 1: Open Supabase Console
Visit: https://app.supabase.com

### Step 2: Select Your Project
Select project: **zgcvgfjyfbvurzygpduy**

### Step 3: Go to SQL Editor
Click **SQL Editor** in the left sidebar

### Step 4: Run First Migration

**Option A: Copy & Paste (Easiest)**
1. Open this file in your editor: `supabase/migrations/20260515100000_schema.sql`
2. Select all content (Ctrl+A or Cmd+A)
3. Copy (Ctrl+C or Cmd+C)
4. In Supabase, click "+ New Query"
5. Paste (Ctrl+V or Cmd+V)
6. Click "RUN" button
7. Wait for green checkmark ✓

**Option B: Upload File (If available)**
Some Supabase projects allow SQL file uploads. If you see an upload button, use that.

### Step 5: Run Remaining Migrations (Same process, different files)

Run in order:
1. ✅ `20260515100000_schema.sql` (Done!)
2. ⏳ `20260515100001_seed.sql` (Next)
3. ⏳ `20260515100002_bulk_200_catalog.sql` (Then)
4. ⏳ `20260515120000_add_game_videos_column.sql` (Last)

For each remaining migration:
- Click "+ New Query"
- Copy/paste the file content
- Click "RUN"
- Wait for success

### Step 6: Verify
Refresh your app (F5 or Cmd+R)

You should now see:
✅ No schema errors
✅ Homepage displays games
✅ Admin section loads
✅ Featured games sections appear

## Troubleshooting

### Error: "Syntax error"
- Make sure you copied the ENTIRE file
- Try again with a fresh copy

### Error: "Table already exists"
- This is normal if you ran migrations before
- Just click OK and continue

### Still seeing errors?
1. Check `.env` or `.env.local` file has Supabase credentials
2. Make sure you're using the correct project (zgcvgfjyfbvurzygpduy)
3. Refresh page after each migration (F5)
4. Check browser console (F12) for error details

## Done! 🎉

Your database is now set up. The app should work perfectly.

### Next Steps (Optional)
- Add more games via admin panel
- Create featured game sections
- Set up user accounts and test cart/wishlist

---

Need more help? See `MIGRATION_SETUP.md` for detailed explanations.
