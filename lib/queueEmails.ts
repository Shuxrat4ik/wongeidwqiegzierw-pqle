import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function queueEmails(emails: string[]) {
  if (!emails.length) return;

  const rows = emails.map((email) => ({
    email,
    status: "pending",
  }));

  await supabase.from("email_queue").insert(rows);
}