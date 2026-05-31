import { Resend } from "resend";

export async function sendNewsletter(emails: string[], game?: any) {
  if (!emails || emails.length === 0) {
    console.log("No emails to send");
    return null;
  }

  const resend = new Resend(process.env.RESEND_API_KEY!);

  const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;background:#050816;font-family:Arial,sans-serif;color:#fff;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#050816;">
      <tr>
        <td align="center">

          <!-- CARD -->
          <table width="650" style="background:#0b1220;border-radius:20px;overflow:hidden;box-shadow:0 0 60px rgba(99,102,241,0.25);">

            <!-- TOP BANNER -->
            <tr>
              <td style="padding:30px;background:linear-gradient(135deg,#4f46e5,#7c3aed);text-align:center;">
                <h1 style="margin:0;font-size:26px;">🎮 NexusVault</h1>
                <p style="margin:5px 0 0;opacity:0.9;">New AAA Game Release</p>
              </td>
            </tr>

            <!-- GAME IMAGE -->
            <tr>
              <td>
                <img 
                  src="https://nexusvault.lat/api/email/open?gameId=${game?.id}"
                  width="1"
                  height="1"
                />
              </td>
            </tr>

            <!-- CONTENT -->
            <tr>
              <td style="padding:30px;">

                <h2 style="margin:0;font-size:24px;color:#fff;">
                  ${game?.title || "New Game Released"}
                </h2>

                <p style="margin-top:10px;color:#a5b4fc;font-size:14px;">
                  ${game?.genre?.join(", ") || "Action • Adventure • Racing"}
                </p>

                <p style="margin-top:15px;color:#cbd5e1;line-height:1.6;">
                  ${game?.description || "Experience the next generation gaming world with ultra graphics and immersive gameplay."}
                </p>

                <!-- INFO BOX -->
                <div style="margin-top:20px;padding:15px;background:#111827;border-radius:12px;">
                  <p style="margin:0;font-size:13px;color:#94a3b8;">
                    ⭐ Rating: ${game?.rating || "N/A"}  
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    💾 Platform: ${game?.platform?.join(", ") || "PC"}
                  </p>
                </div>

                <!-- BUTTON -->
                <div style="margin-top:25px;text-align:center;">
                  <a href="https://nexusvault.lat"
                     style="display:inline-block;padding:14px 26px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;box-shadow:0 10px 25px rgba(99,102,241,0.4);">
                     🚀 Play Now
                  </a>
                </div>

              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:20px;text-align:center;font-size:12px;color:#6b7280;">
                You received this email because you subscribed to <b>NexusVault</b>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
</html>
  `;

  const result = await resend.emails.send({
    from: "NexusVault <noreply@nexusvault.lat>",
    to: emails,
    subject: `🔥 ${game?.title || "New Game"} Just Dropped!`,
    html,
  });

  console.log("EMAIL SENT:", result);

  return result;
}