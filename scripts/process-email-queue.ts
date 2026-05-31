import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { sendNewsletter } from "../lib/sendNewsletter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  // 1. get pending emails
  const { data } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .limit(50);

  if (!data || data.length === 0) {
    console.log("No emails in queue");
    return;
  }

  const emails = data.map((e) => e.email);

  try {
    // 2. send batch
    await sendNewsletter(emails);

    // 3. mark as sent
    await supabase
      .from("email_queue")
      .update({ status: "sent" })
      .in("id", data.map((e) => e.id));

    console.log(`Sent ${emails.length} emails`);
  } catch (err) {
    console.error("Worker error:", err);

    // 4. retry logic
    await supabase
      .from("email_queue")
      .update({
        status: "failed",
        retries: 1,
      })
      .in("id", data.map((e) => e.id));
  }
}

run();