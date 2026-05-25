# Production Troubleshooting Guide

## Common Issues & Solutions

### 1. GET /api/download returns 500

**Symptoms**: Download endpoint returns 500 Internal Server Error

**Root Causes & Fixes**:

#### Missing R2 Configuration
```
Error: Missing R2 environment variables: CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ENDPOINT, ...
```
**Fix**: 
- Add all R2 env vars to Vercel project settings
- Verify values don't include invalid characters
- Check that `CLOUDFLARE_R2_SECRET_ACCESS_KEY` is a key, not a URL

#### Invalid R2 Credentials
```
Error: NoCredentialsError
```
**Fix**:
- Verify R2 access key and secret key are correct
- Check that bucket still exists in Cloudflare
- Ensure bucket has proper CORS if accessed from browser

#### Game Not Found
```
Game not found (404)
```
**Expected behavior** - user asked for invalid slug. Returns proper 404 response.

#### User Doesn't Own Game
```
You do not own this game (403)
```
**Expected behavior** - user hasn't purchased/claimed the game. Returns proper 403 response.

---

### 2. npm run build fails with EPIPE

**Symptoms**: 
```
unhandledRejection [Error: write EPIPE]
Command "npm run build" exited with 1
```

**Root Causes & Fixes**:

#### Memory Pressure
**Fix**: Node options in package.json now includes `--max-old-space-size=4096`
- Verify this is set: `grep "NODE_OPTIONS" package.json`
- For CI/CD, ensure runner has 4GB+ memory

#### Build Timeout
**Fix**: Some CI/CD runners have strict timeouts
- Increase timeout in Vercel settings (default 45 minutes)
- Check CI/CD logs for actual error before EPIPE

#### Stream Closure
**Fix**: Turbopack or Next.js crashing silently
- Check build logs: `npm run build 2>&1 | tail -100`
- Look for TypeScript or compilation errors before EPIPE
- Try building in clean environment: `rm -rf .next && npm run build`

---

### 3. All API requests return 500

**Symptoms**: Every API endpoint returns 500 Internal Server Error

**Root Causes**:

#### Missing Supabase Configuration
```
Error: Server missing Supabase environment variables
```
**Fix**:
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel
- Restart deployment after adding env vars

#### Missing Database Permissions
```
Error: row-level security
```
**Fix**:
- Verify RLS policies in Supabase
- Check that service role key has proper permissions
- Run migrations if database schema changed

#### Database Connection Pool Exhausted
```
Error: remaining connection slots are reserved
```
**Fix**:
- Reduce concurrent requests (add caching)
- Check Supabase connection pool settings
- Reduce timeout values to fail faster

---

### 4. Build Succeeds but App Crashes on Load

**Symptoms**: Build passes, but app 500 errors when visiting pages

**Check**:
- Vercel function logs: `vercel logs --follow`
- Look for initialization errors
- Check if environment variables are loaded at runtime

**Common Issues**:
- Environment variable accessed at build-time instead of runtime
- Database connection fails at startup
- R2 configuration validation too strict

---

### 5. Authentication Fails / 401 Everywhere

**Symptoms**: Every route returns 401 Unauthorized

**Root Causes**:

#### Invalid Supabase Session
**Fix**:
- Clear browser cookies: `document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"`
- Re-login
- Check Supabase auth configuration

#### Mismatched Auth Tokens
**Fix**:
- Verify session cookie name is `sb-access-token` or `access_token`
- Check token isn't expired
- Verify token was issued by correct Supabase instance

#### CORS Issues
**Fix**:
- Check Vercel deployment domain matches `NEXT_PUBLIC_APP_URL`
- Add domain to Supabase allowed URLs if needed
- Check browser console for CORS errors

---

### 6. Stripe Payments Not Working

**Symptoms**: Checkout fails or webhooks don't process

**Root Causes**:

#### Test vs Production Keys
**Fix**:
- Verify correct keys are in Vercel (prod keys, not test)
- Check that all Stripe-related env vars are updated
- Test keys start with `sk_test_` or `pk_test_`
- Production keys start with `sk_live_` or `pk_live_`

#### Webhook Not Configured
**Fix**:
- In Stripe dashboard, add webhook endpoint: `https://yourdomain.com/api/payments/webhook`
- Update `STRIPE_WEBHOOK_SECRET` in Vercel
- Test webhook delivery in Stripe dashboard

#### Webhook Signature Invalid
```
Error: Invalid Stripe signature
```
**Fix**:
- Verify webhook secret is correct
- Check that webhook is receiving POST requests
- Verify request body isn't modified before validation

---

### 7. Download Links Expire Too Quickly

**Symptoms**: Signed R2 URLs expire before user downloads

**Note**: Signed URLs expire after 120 seconds (default)

**Fix**:
- User must click download immediately
- Or deploy public R2 bucket and set `CLOUDFLARE_R2_PUBLIC_URL`
- Update `SIGNED_DOWNLOAD_TTL_SECONDS` in `lib/server/download-service.ts` if needed

---

### 8. Database Queries Are Slow

**Symptoms**: Pages take 5+ seconds to load, API responses are slow

**Check**:
- Supabase query performance in dashboard
- Add indexes to frequently queried columns
- Add pagination to large result sets
- Use `.select('specific, columns')` instead of `.*`

**Optimize**:
- Cache static data (games list, categories)
- Add response caching headers: `Cache-Control: public, max-age=3600`
- Implement CDN caching for static assets

---

### 9. Out of Memory Errors

**Symptoms**:
```
Error: JavaScript heap out of memory
```

**Fix**:
- Increase `--max-old-space-size` in package.json (already set to 4096)
- For Vercel, memory limit is high enough (512MB+)
- Check for memory leaks in long-running processes
- Reduce bundle size (tree-shake imports)

---

### 10. CORS / Origin Errors

**Symptoms**:
```
Error: CORS policy: No 'Access-Control-Allow-Origin' header
```

**Fix**:
- Ensure `NEXT_PUBLIC_APP_URL` matches your domain
- For R2 downloads, configure CORS in Cloudflare:
  ```
  CORS Origin: https://yourdomain.com
  Methods: GET, HEAD
  Headers: Accept, Accept-Language, Range
  ```
- Verify frontend is using same protocol (https://)

---

## Debugging Checklist

For any production error:

1. **Check Vercel Logs**
   ```bash
   vercel logs --follow
   ```

2. **Check Recent Deployments**
   ```bash
   vercel list
   ```

3. **Validate Environment Variables**
   ```bash
   node scripts/validate-env.js
   ```

4. **Check Database Health**
   - Log into Supabase dashboard
   - Run query: `SELECT COUNT(*) FROM games;`
   - Check database status/health

5. **Check Error Details in Browser**
   - Open DevTools
   - Check Network tab for failed requests
   - Check Console tab for client-side errors
   - Check API response body for error message

6. **Test Endpoint Directly**
   ```bash
   curl -i https://yourdomain.com/api/games
   ```

7. **Compare with Staging**
   - Does staging work? If yes, prod issue is environment-specific
   - Does staging also fail? Issue is code-related

8. **Check Recent Changes**
   - Review last commit: `git log -1 --stat`
   - Compare with last successful deploy
   - Revert if necessary: `git revert <commit>`

---

## Emergency Procedures

### Rolling Back a Bad Deploy

1. Identify problematic commit
2. Create revert commit: `git revert <bad-commit>`
3. Push to main: `git push origin main`
4. Vercel will auto-deploy
5. Verify: Visit https://yourdomain.com

### Disabling an API Route Temporarily

1. Wrap handler in condition:
   ```typescript
   if (process.env.DISABLE_DOWNLOAD_API === 'true') {
     return apiError('Download service temporarily unavailable', 503);
   }
   ```
2. Add `DISABLE_DOWNLOAD_API=true` to Vercel env
3. Redeploy
4. Fix the underlying issue
5. Remove the env var and redeploy

### Database Recovery

If database is corrupted:

1. Verify backups exist in Supabase dashboard
2. Use point-in-time recovery (PITR) feature
3. Or restore from backup in Supabase
4. Notify users of potential data loss
5. Update deployment notes

---

## Monitoring & Alerts

Set up notifications for:

1. **Vercel**: Deployment failures
2. **Stripe**: Failed charge attempts, webhook failures
3. **Supabase**: Database errors, auth failures
4. **Sentry/LogRocket** (optional): JavaScript errors

---

## Performance Baseline

Target metrics:

| Metric | Target | Actual |
|--------|--------|--------|
| First Load JS | < 250KB | [Check] |
| LCP | < 2.5s | [Check] |
| INP | < 200ms | [Check] |
| CLS | < 0.1 | [Check] |
| RES Score | >= 90 | [Check] |

Check using:
- Vercel Analytics
- Google PageSpeed Insights
- Lighthouse in Chrome DevTools

---

**Last Updated**: 2026-05-26
**For Support**: Check logs, validate env, test endpoints, rollback if needed
