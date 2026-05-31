import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// 🔥 IMPORTANT: NO realtime import at all
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: undefined, // 💥 KEY FIX
  }
);

async function sync() {
  const { data, error } = await supabase
    .from("profiles")
    .select("email");

  if (error) {
    console.error(error);
    return;
  }

  const emails = (data || [])
    .map((p) => p.email)
    .filter(Boolean);

  console.log("Found emails:", emails.length);

  const { error: insertError } = await supabase
    .from("subscribers")
    .upsert(
      emails.map((email) => ({ email })),
      { onConflict: "email" }
    );

  if (insertError) {
    console.error(insertError);
    return;
  }

  console.log("SYNC DONE 🚀");
}

sync();