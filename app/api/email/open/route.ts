import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get("gameId");

  console.log("EMAIL OPENED:", gameId);

  return new NextResponse("ok", {
    headers: {
      "Content-Type": "image/png",
    },
  });
}