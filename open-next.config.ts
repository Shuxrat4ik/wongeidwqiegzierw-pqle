// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import('@opennextjs/cloudflare')
  .then((m) => m.initOpenNextCloudflareForDev())
  .catch((err) => {
    console.error('[OpenNext DEV ERROR]', err);
  });

export default defineCloudflareConfig({
  incrementalCache: process.env.NODE_ENV === 'production'
    ? r2IncrementalCache
    : undefined,
});
