function required(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`❌ Missing ENV: ${name}`);
  }

  return value;
}

export const env = {
  SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  R2_BUCKET: required("CLOUDFLARE_R2_BUCKET"),
};
