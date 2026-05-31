import { sendNewsletter } from "@/lib/sendNewsletter";
import { createClient } from "@supabase/supabase-js";

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueSlug(base: string) {
  const random = Math.floor(Math.random() * 10000);
  return `${base}-${random}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, description, cover_image } = body;
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString().slice(-5)}`;

    const { data: game, error } = await supabaseServer
      .from("games")
      .insert({
        title,
        description,
        cover_image,
        slug,
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    // 📧 subscribers
    const { data: subs } = await supabaseServer
      .from("subscribers")
      .select("email");

    const emails = (subs || [])
      .map((s) => s.email)
      .filter(Boolean);

    // 🚀 EMAIL SEND
    if (emails.length > 0) {
      await sendNewsletter(emails, game);
    }

    // mark sent
    await supabaseServer
      .from("games")
      .update({ email_sent: true })
      .eq("id", game.id);

    return Response.json({
      success: true,
      game,
      sent: emails.length,
    });
  } catch (err: any) {
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}