# Error Messages Reference

## Error 1: PGRST200 - Relationship Error

**Message:**
```
Failed to load homepage: "{\"code\":\"PGRST200\",\"details\":\"Searched for a foreign key 
relationship between 'featured_games' and 'games' in the schema 'public', but no matches 
were found.\",\"hint\":null,\"message\":\"Could not find a relationship between 
'featured_games' and 'games' in the schema cache\"}"
```

**What it means:**
- PostgREST tried to automatically join two tables
- It couldn't find the foreign key relationship in its cache
- The relationship exists in your code but not in the database yet

**Root causes:**
1. ❌ Migrations haven't been applied to Supabase
2. ❌ PostgREST relationship cache is stale
3. ❌ Query uses `select('*, related_table(*)')` pattern

**Fixed by:**
- ✅ Running database migrations
- ✅ Changing query pattern to explicit joins
- ✅ Fetching related data in separate queries

**Status in your app:**
- ✅ FIXED - Code updated to avoid this pattern
- ⏳ Still need to apply migrations

---

## Error 2: Failed to Load Cart

**Message:**
```
Failed to load cart: {}
```

**What it means:**
- Cart query failed with no error details
- Likely caused by relationship join failure
- User sees empty cart instead of items

**Root causes:**
1. ❌ Cart table uses `select('*, games(*)')` pattern
2. ❌ Games relationship not in PostgREST cache

**Fixed by:**
- ✅ Changed to two-step query pattern
- ✅ Fetch cart items first, then games separately
- ✅ Merge in application code

**Status in your app:**
- ✅ FIXED - Code updated

---

## Error 3: Failed to Load Wishlist

**Message:**
```
Failed to load wishlist: {}
```

**What it means:**
- Wishlist query failed silently
- User can't see their wishlist items

**Root causes:**
1. ❌ Wishlist table doesn't exist (not created by migrations)
2. ⚠️ Error handling could be clearer

**Fixed by:**
- ✅ Added better error logging
- ✅ Clearer error messages for debugging
- ⏳ Need to apply migrations to create table

**Status in your app:**
- ✅ PARTIALLY FIXED - Better error messages added
- ⏳ Still need to apply migrations

---

## Error 4: Schema Cache Error

**Message:**
```
Could not find the table 'public.profiles' in the schema cache
Could not find the table 'public.orders' in the schema cache
Could not find the table 'public.game_categories' in the schema cache
```

**What it means:**
- PostgREST is looking for tables that don't exist in your database
- Tables are defined in code/migrations but not created in Supabase yet
- This is a general "schema not initialized" error

**Root causes:**
1. ❌ Migrations haven't been run on your Supabase instance
2. ❌ Tables exist in `supabase/migrations/*.sql` but not in actual database

**Fixed by:**
- ✅ Added error detection for schema cache errors
- ✅ Admin page shows helpful message with migration instructions
- ⏳ Need to apply migrations to create tables

**Status in your app:**
- ✅ PARTIALLY FIXED - Better error messages in admin
- ⏳ Still need to apply migrations

---

## How These Errors Are Related

All errors stem from the same root problem:

```
Your code thinks tables exist (they're in migrations)
          ↓
But they don't exist in your actual Supabase database
          ↓
PostgREST can't find them
          ↓
Queries fail with cryptic errors
```

---

## The Fix: Two Parts

### Part 1: Code Changes ✅ DONE
- Changed relationship queries to explicit joins
- Better error messages
- More reliable pattern

### Part 2: Apply Migrations ⏳ YOU DO THIS
- Run SQL migrations in Supabase console
- Creates all required tables
- Populates test data
- See `QUICK_START.md` for instructions

---

## Summary

| Error | Cause | Code Fix | DB Fix |
|-------|-------|----------|--------|
| PGRST200 | Relationship cache | ✅ | ⏳ |
| Load cart | Relationship join | ✅ | ⏳ |
| Load wishlist | Missing table | ✅ | ⏳ |
| Schema cache | Migrations not run | ✅ | ⏳ |

✅ = Done
⏳ = Need to apply migrations

---

## Next Steps

1. Read `QUICK_START.md`
2. Apply migrations to Supabase
3. Refresh your app
4. All errors should be gone! 🎉
