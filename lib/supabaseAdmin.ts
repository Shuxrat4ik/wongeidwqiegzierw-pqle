import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase env variables");
}

// 🔥 IMPORTANT: Node script uchun realtime to‘liq OFF
export const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },

  realtime: {
    params: {
      eventsPerSecond: 0,
    },
  },

  // 🔥 BU ENG MUHIM QISM (fix for Node 20)
  global: {
    fetch,
  },
});