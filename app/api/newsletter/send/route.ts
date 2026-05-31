import { createClient } from "@supabase/supabase-js";
import { queueEmails } from "@/lib/queueEmails";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  const { data } = await supabase
    .from("subscribers")
    .select("email");

  const emails = (data || []).map((u) => u.email);

  if (!emails.length) {
    return Response.json({ error: "No subscribers" }, { status: 400 });
  }

  // 🔥 NOW WE ONLY QUEUE (not send directly)
  await queueEmails(emails);

  return Response.json({
    success: true,
    queued: emails.length,
  });
}