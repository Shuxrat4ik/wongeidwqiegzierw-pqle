import { sendNewsletter } from "@/lib/sendNewsletter";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = await req.json();

  const { data: game, error } = await supabase
    .from("games")
    .insert(body)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // 🔥 GET ALL SUBSCRIBERS
  const { data: subs } = await supabase
    .from("subscribers")
    .select("email");

  const emails = subs?.map((s) => s.email) || [];

  if (game.email_sent) {
  console.log("Email already sent");
  return;
}

  // 🚀 AUTO EMAIL SEND
  await sendNewsletter(emails, game);

  await supabase
  .from("games")
  .update({ email_sent: true })
  .eq("id", game.id);

  return Response.json({
    success: true,
    game,
    sent: emails.length,
  });
}