import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });

import { sendNewsletter } from "../lib/sendNewsletter";

async function main() {
  console.log("ENV CHECK:", {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    resend: !!process.env.RESEND_API_KEY,
  });

  await sendNewsletter([
    "asliddinovshuxrat2005@gmail.com"
  ]);

  console.log("DONE 🚀");
}

main().catch(console.error);