# Admin Games Not Showing - Diagnostic Checklist

## Step 1: Check Database Migrations ✓ CRITICAL
- [ ] Have you applied migrations to Supabase? (See QUICK_START.md)
- [ ] The `games` table must exist in the database
- [ ] Without migrations, ALL tables are missing

**Status:** If you haven't run migrations, NO data will show.

## Step 2: Check You're Logged In As Admin
In the admin page:
- [ ] Do you see "Shield" icon in top navigation?
- [ ] Are you logged in? (Check top-right corner)
- [ ] What's your email address?

**Important:** Your account must be:
1. Signed in to Supabase Auth, AND
2. Have `is_admin = true` in the `profiles` table

OR

Have the built-in admin email: `admin@gamestore.com`

## Step 3: Check Browser Console (F12)
Open DevTools → Console tab and look for:

### Good signs:
- `[admin] Games API response: { status: 200, payload: { games: [...] } }`
- Games list appears in the table

### Bad signs:
- `status: 403` - Permission denied (RLS issue)
- `status: 401` - Not authenticated
- `status: 500` - Server error
- `status: 400` - Invalid request
- Network tab shows API calls failing

## Step 4: Check Network Tab (F12)
1. Press F12 to open DevTools
2. Go to "Network" tab
3. Reload the page (F5)
4. Look for `/api/admin/games` request
5. Check:
   - Status: Should be 200 (green)
   - Response: Should show `{ "games": [...] }` 
   - If not 200, note the error message

## Step 5: Check Service Role Key
Admin writes need either:
- SUPABASE_SERVICE_ROLE_KEY in `.env.local`, OR
- RLS policies that allow admin writes

Your `.env` already has `SUPABASE_SERVICE_ROLE_KEY`, so this should work.

## Common Issues & Fixes

### Issue: "Admin access required" error (403)
**Cause:** User is not marked as admin
**Fix:** 
- Option 1: Sign up with email `admin@gamestore.com` (built-in admin)
- Option 2: Make your user admin in Supabase Dashboard:
  - Go to Auth users
  - Find your user
  - Go to profiles table
  - Set `is_admin = true` for your user_id

### Issue: "Could not find table in schema cache" error
**Cause:** Migrations not applied
**Fix:** Run migrations in Supabase SQL Editor (See QUICK_START.md)

### Issue: Empty games list but no error
**Cause:** 
- Migrations applied but no game data inserted
- RLS blocking reads
**Fix:**
- Check seed migration created test games
- Run bulk_200_catalog.sql migration to add 200 example games

### Issue: Network shows 200 but games still empty
**Cause:** API returns `{ games: [] }` (empty array)
**Fix:**
- Check migrations were actually applied
- Check Supabase dashboard → Tables → games table exists and has data
- Check for RLS policies blocking SELECT

## Debug Steps (Advanced)

### 1. Check the actual API call
```typescript
// Open browser console and run:
const token = await supabase.auth.getSession();
const res = await fetch('/api/admin/games', {
  headers: { Authorization: `Bearer ${token.data.session.access_token}` }
});
console.log(await res.json());
```

### 2. Check games table directly
Go to Supabase Dashboard:
- Tables → games
- Should show at least some rows
- If empty, migrations didn't populate data

### 3. Check profiles table
Go to Supabase Dashboard:
- Auth → Users - Find yourself
- Tables → profiles
- Check if your row exists
- Check if is_admin = true

## One-Minute Quick Fix

If games show in homepage but not in admin:

1. **Open browser DevTools (F12)**
2. **Console tab**
3. **Look for error message** in logs
4. **Tell me the error message** and I'll help fix it

Most common: Missing migrations or user not marked as admin
