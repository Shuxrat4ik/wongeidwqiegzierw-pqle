import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  if (!isValidEmail(email)) {
    return Response.json({ error: "Invalid email" }, { status: 400 });
  }

  // ❌ unsubscribe bo‘lganlarni qayta qo‘shmaslik
  const { data: unsub } = await supabase
    .from("unsubscribes")
    .select("email")
    .eq("email", email)
    .single();

  if (unsub) {
    return Response.json(
      { error: "You have unsubscribed" },
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("subscribers")
    .upsert({ email });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}