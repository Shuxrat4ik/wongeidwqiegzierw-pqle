const dotenv = require("dotenv");

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const requiredEnvGroups = [
  ["NEXT_PUBLIC_SUPABASE_URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
  ["SUPABASE_SERVICE_ROLE_KEY"],
  ["NEXT_PUBLIC_APP_URL"],

  ["B2_KEY_ID", "AWS_ACCESS_KEY_ID"],
  ["B2_APP_KEY", "AWS_SECRET_ACCESS_KEY"],
  ["B2_BUCKET"],
  ["B2_ENDPOINT"],
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
  console.log("Validating environment variables...\n");

  let missing = [];

  for (const group of requiredEnvGroups) {
    const configuredKey = group.find((key) => process.env[key]);
    if (!configuredKey) {
      const label = group.join(" or ");
      missing.push(label);
      console.error(`Missing: ${label}`);
    } else {
      console.log(`OK: ${configuredKey}`);
    }
  }

  const urlChecks = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_APP_URL"];

  for (const key of urlChecks) {
    if (process.env[key] && !isValidUrl(process.env[key])) {
      missing.push(`${key} must be a valid http(s) URL`);
      console.error(`Invalid: ${key} must be a valid http(s) URL`);
    }
  }

  if (missing.length > 0) {
    console.error("\n ENV VALIDATION FAILED!");
    console.error("Missing variables:", missing.join(", "));
    console.error("\nFix your .env file before starting the app.\n");
    process.exit(1);
  }

  console.log("\n All environment variables are valid!\n");
}

validateEnv();
