import { createClient } from "@supabase/supabase-js";
import { sendNewsletter } from "./sendNewsletter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendNewGamesNewsletter() {
  // 1. only NEW games
  const { data: games } = await supabase
    .from("games")
    .select("*")
    .eq("emailed", false);

  if (!games || games.length === 0) {
    return { message: "No new games" };
  }

  // 2. subscribers
  const { data: subs } = await supabase
    .from("subscribers")
    .select("email");

  const emails = (subs || []).map((u) => u.email);

  if (!emails.length) {
    return { message: "No subscribers" };
  }

  // 3. send email
  const result = await sendNewsletter(emails);

  // 4. mark games as sent
  await supabase
    .from("games")
    .update({ emailed: true })
    .in(
      "id",
      games.map((g) => g.id)
    );

  // 5. log
  await supabase.from("newsletter_logs").insert({
    sent_count: emails.length,
  });

  return { success: true, result };
}