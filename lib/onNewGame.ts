import { sendNewGamesNewsletter } from "./newsletterEngine";

export async function onNewGameCreated() {
  try {
    await sendNewGamesNewsletter();
  } catch (err) {
    console.error("Auto newsletter failed:", err);
  }
}