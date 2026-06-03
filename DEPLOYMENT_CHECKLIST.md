# Production Deployment Checklist

## Pre-Deployment Requirements

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Verify Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Verify anon key  
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Verify service role key (server-only)
- [ ] `STRIPE_SECRET_KEY` - Verify Stripe secret (server-only, starts with sk_)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Verify publishable key (starts with pk_)
- [ ] `STRIPE_WEBHOOK_SECRET` - For webhook validation
- [ ] `CLOUDFLARE_R2_ENDPOINT` - R2 endpoint URL
- [ ] `CLOUDFLARE_R2_ACCESS_KEY` - R2 access key
- [ ] `CLOUDFLARE_R2_SECRET_ACCESS_KEY` - R2 secret key (not a URL)
- [ ] `CLOUDFLARE_R2_BUCKET` - R2 bucket name
- [ ] `NEXT_PUBLIC_APP_URL` - Application base URL (no trailing slash)
- [ ] `NEXT_PUBLIC_AFFILIATE_URL` or `NEXT_PUBLIC_AFFILIATE_URL_TEMPLATE` - Optional Buy Now affiliate redirect

Affiliate examples:

```env
NEXT_PUBLIC_AFFILIATE_URL=https://partner.example.com/buy?ref=nexusvault
NEXT_PUBLIC_AFFILIATE_URL_TEMPLATE=https://partner.example.com/games/{slug}?ref=nexusvault
```
- [ ] `CLOUDFLARE_R2_PUBLIC_URL` - Optional, only if R2 bucket is public

### Run Validation
```bash
node scripts/validate-env.js
```

## Build & Test

- [ ] Clear build cache: `rm -rf .next`
- [ ] Run build: `npm run build` (should complete without errors)
- [ ] Check build output for size regressions
- [ ] Run linting: `npm run lint` (should pass)
- [ ] Run type checking: `npm run typecheck` (should pass)
- [ ] Test critical endpoints locally:
  - `GET /api/download?slug=test-game` (returns proper error if missing config)
  - `GET /api/games` (lists games)
  - `POST /api/auth/login` (returns proper error if invalid)

## Performance Checks

- [ ] Bundle size < 250KB First Load JS
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] INP (Interaction to Next Paint) < 200ms
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] Real Experience Score >= 90

Use Vercel Analytics or Google PageSpeed Insights to verify.

## Error Handling Verification

All API endpoints should:
- [ ] Return proper JSON responses (never empty/500 with no response)
- [ ] Include descriptive error messages
- [ ] Use appropriate HTTP status codes:
  - 400 - Bad request (invalid input)
  - 401 - Unauthorized (missing/invalid auth)
  - 403 - Forbidden (insufficient permissions)
  - 404 - Not found (resource doesn't exist)
  - 409 - Conflict (duplicate/already owned)
  - 429 - Too many requests (rate limited)
  - 502 - Bad gateway (database/upstream service error)
  - 503 - Service unavailable (missing configuration)
  - 500 - Only for unexpected errors (should be rare)

Test error scenarios:
- [ ] Missing required query parameters
- [ ] Invalid authentication token
- [ ] Nonexistent game slug
- [ ] Missing R2 configuration (should return 503, not 500)
- [ ] Missing Supabase configuration (should return 503, not 500)

## Database & Services

- [ ] Supabase database is accessible and healthy
- [ ] RLS (Row-Level Security) policies are correct
- [ ] Service role key permissions are set properly
- [ ] Stripe test keys are replaced with production keys (PROD ONLY)
- [ ] Stripe webhook endpoint is configured and active
- [ ] R2 bucket exists and is accessible
- [ ] R2 CORS headers are configured (if using from browser)

## DNS & SSL

- [ ] Domain is pointing to Vercel
- [ ] SSL certificate is valid and not expiring soon
- [ ] Environment-specific URLs are correct (staging vs prod)

## Deployment Steps (Vercel)

1. Ensure all environment variables are set in Vercel project settings
2. Merge PR to main branch (or deploy branch)
3. Vercel will auto-build and deploy
4. Wait for deployment to complete
5. Visit https://yourdomain.com to verify
6. Check Vercel Analytics for performance metrics
7. Monitor error logs for 48 hours

## Post-Deployment

- [ ] Verify homepage loads without errors
- [ ] Test user authentication flow
- [ ] Test game purchase workflow (with test keys first)
- [ ] Test file download (at least one free/owned game)
- [ ] Check Vercel Analytics for any error spikes
- [ ] Monitor error logs: `vercel logs --follow`
- [ ] Verify API endpoints via curl or Postman

## Rollback Plan

If critical errors occur:

1. Identify the issue in Vercel deployments
2. Revert to last known good commit: `git revert <bad-commit>`
3. Push to deploy branch
4. Vercel will auto-deploy the reverted version
5. Verify functionality is restored
6. Investigate and fix the issue in a new branch

## Critical API Routes to Test

```bash
# Test unauthenticated access (should return 401)
curl -H "Content-Type: application/json" https://yourdomain.com/api/library

# Test invalid slug (should return 404)
curl https://yourdomain.com/api/download?slug=nonexistent-game-12345

# Test missing R2 config (should return 503, not 500)
# (Only if R2 env vars are intentionally missing for testing)

# Test rate limiting
for i in {1..30}; do
  curl -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password"}' \
    https://yourdomain.com/api/auth/login
done
# Should return 429 after hitting limit
```

## Monitoring & Alerts

Set up alerts for:
- Error rate > 1%
- Response time > 3s
- Build failures
- Deployment failures
- Missing environment variables (check logs)

## Documentation Updates

- [ ] Update README with any changes
- [ ] Update API documentation if endpoints changed
- [ ] Add deployment notes for team
- [ ] Document any manual setup required

---

**Last Updated:** 2026-05-26
**Deployed By:** [Your Name]
**Version:** [Commit SHA]
