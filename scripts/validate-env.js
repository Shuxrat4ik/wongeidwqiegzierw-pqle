// scripts/validate-env.js

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLOUDFLARE_R2_ENDPOINT",
  "CLOUDFLARE_R2_ACCESS_KEY",
  "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
  "CLOUDFLARE_R2_BUCKET",
];

function validateEnv() {
  console.log("🔍 Validating environment variables...\n");

  let missing = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
      console.error(`❌ Missing: ${key}`);
    } else {
      console.log(`✅ OK: ${key}`);
    }
  }

  if (missing.length > 0) {
    console.error("\n🚨 ENV VALIDATION FAILED!");
    console.error("Missing variables:", missing.join(", "));
    console.error("\nFix your .env file before starting the app.\n");

    process.exit(1);
  }

  console.log("\n✅ All environment variables are valid!\n");
}

validateEnv();