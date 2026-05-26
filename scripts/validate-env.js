// scripts/validate-env.js
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const requiredEnvGroups = [
  ["NEXT_PUBLIC_SUPABASE_URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  ["SUPABASE_SERVICE_ROLE_KEY"],
  ["NEXT_PUBLIC_APP_URL"],
  ["STRIPE_SECRET_KEY"],
  ["NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
  ["STRIPE_WEBHOOK_SECRET"],
  ["CLOUDFLARE_R2_ENDPOINT", "R2_ENDPOINT", "CLOUDFLARE_R2_ACCOUNT_ID", "R2_ACCOUNT_ID"],
  ["CLOUDFLARE_R2_ACCESS_KEY", "R2_ACCESS_KEY", "AWS_ACCESS_KEY_ID"],
  ["CLOUDFLARE_R2_SECRET_ACCESS_KEY", "R2_SECRET_KEY", "AWS_SECRET_ACCESS_KEY"],
  ["CLOUDFLARE_R2_BUCKET", "R2_BUCKET"],
];

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateEnv() {
  console.log("🔍 Validating environment variables...\n");

  let missing = [];

  for (const group of requiredEnvGroups) {
    const configuredKey = group.find((key) => process.env[key]);
    if (!configuredKey) {
      const label = group.join(" or ");
      missing.push(label);
      console.error(`❌ Missing: ${label}`);
    } else {
      console.log(`✅ OK: ${configuredKey}`);
    }
  }

  const urlChecks = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_APP_URL"];
  for (const key of urlChecks) {
    if (process.env[key] && !isValidUrl(process.env[key])) {
      missing.push(`${key} must be a valid http(s) URL`);
      console.error(`❌ Invalid: ${key} must be a valid http(s) URL`);
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
