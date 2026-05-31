import { sendNewGamesNewsletter } from "@/lib/newsletterEngine";

export async function GET() {
  const result = await sendNewGamesNewsletter();

  return Response.json(result);
}