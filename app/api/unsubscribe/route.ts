import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  await supabase.from("unsubscribes").upsert({ email });

  await supabase.from("subscribers").delete().eq("email", email);

  return Response.json({ success: true });
}