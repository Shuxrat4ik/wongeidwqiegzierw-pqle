# Production Backend

This app now uses a deployable Next.js API backend with module-style route groups:

- `app/api/auth/*` - server auth endpoints with HTTP-only session cookies.
- `app/api/games` - paginated catalog API.
- `app/api/admin/games` - admin CRUD for games.
- `app/api/checkout` - Stripe Checkout session creation.
- `app/api/payments/webhook` - verified Stripe webhook fulfillment.
- `app/api/orders` - user order and payment history.

## Folder Structure

```txt
app/api/
  auth/
    login/route.ts
    register/route.ts
    refresh/route.ts
    logout/route.ts
    me/route.ts
  games/route.ts
  admin/games/route.ts
  checkout/route.ts
  payments/webhook/route.ts
  orders/route.ts
lib/server/
  auth.ts
  http.ts
  pricing.ts
  rate-limit.ts
  session-cookies.ts
  stripe.ts
  supabase-server.ts
supabase/migrations/
  20260515100000_schema.sql
  20260522090000_stripe_checkout_orders.sql
```

## API Endpoints

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Email/password registration. Password hashing and JWT issuance are handled by Supabase Auth. Sets HTTP-only cookies when email confirmation is not required. | Public, rate limited |
| `POST` | `/api/auth/login` | Email/password login. Sets HTTP-only access and refresh cookies. | Public, rate limited |
| `POST` | `/api/auth/refresh` | Rotates refresh token and sets fresh HTTP-only cookies. | Refresh cookie |
| `POST` | `/api/auth/logout` | Clears auth cookies. | Public |
| `GET` | `/api/auth/me` | Returns the current user and role. | User |
| `GET` | `/api/games?page=1&pageSize=24` | Paginated game listing. | Public |
| `GET` | `/api/admin/games` | Admin game list. | Admin |
| `POST` | `/api/admin/games` | Create game. | Admin |
| `PATCH` | `/api/admin/games` | Update game. | Admin |
| `DELETE` | `/api/admin/games?id=...` | Delete game. | Admin |
| `POST` | `/api/checkout` | Creates a pending order and Stripe Checkout session. | User, rate limited |
| `POST` | `/api/payments/webhook` | Verifies Stripe signature, records payment, grants library items, clears purchased cart items. | Stripe signature |
| `GET` | `/api/orders?page=1&pageSize=10` | User order history. | User |

## Database Schema

Core tables:

- `profiles`: `id`, `email`, `username`, `avatar_url`, `bio`, `is_admin`, timestamps.
- `games`: `id`, `title`, `slug`, `description`, `price`, images, category fields, metadata, availability.
- `orders`: `id`, `user_id`, totals, `status`, `stripe_session_id`, `stripe_payment_intent_id`, timestamps.
- `order_items`: per-game purchase rows for each order.
- `payments`: `id`, `order_id`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `status`, raw Stripe event metadata.

Run the new migration:

```bash
supabase db push
```

or apply `supabase/migrations/20260522090000_stripe_checkout_orders.sql` in the Supabase SQL editor.

## Stripe Webhook

Local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the `whsec_...` value into `STRIPE_WEBHOOK_SECRET`.

The webhook handler:

- Uses `stripe.webhooks.constructEvent` for signature verification.
- Treats `checkout.session.completed` and `checkout.session.async_payment_succeeded` as paid.
- Uses `stripe_checkout_session_id` uniqueness to prevent duplicate payment rows.
- Leaves already completed orders untouched, so repeated webhook deliveries are idempotent.
- Grants games through `library` with `upsert` on `user_id,game_id`.

## Environment

Required production variables:

```bash
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
```

Set CORS at the hosting/proxy layer to allow only the deployed frontend origin. Same-origin Vercel deployment does not need extra CORS for these route handlers.
