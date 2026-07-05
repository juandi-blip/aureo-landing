import { Resend } from "resend";

let resend: Resend | null = null;

// User-supplied strings land inside the notification HTML; the email regex
// still admits characters like <, > and quotes, so escape them.
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function notifyNewSignup(rawEmail: string, rawOrigen: string): Promise<void> {
  const client = getResend();
  if (!client) return; // Silently skip if not configured

  const email = escapeHtml(rawEmail);
  const origen = escapeHtml(rawOrigen);

  const to = process.env.NOTIFY_EMAIL ?? "juanda24florezvizcaino@gmail.com";
  const fromDomain = process.env.RESEND_FROM_DOMAIN ?? "onboarding@resend.dev";

  await client.emails.send({
    from: `Aureo Waitlist <${fromDomain}>`,
    to,
    subject: `🚀 Nuevo registro en lista de espera — ${email}`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #F7F3EA; border-radius: 12px;">
        <h1 style="color: #2E4A6E; font-size: 22px; margin: 0 0 8px;">Nuevo registro en Aureo</h1>
        <p style="color: #6E6354; margin: 0 0 24px; font-size: 15px;">Alguien acaba de unirse a la lista de espera.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #E7DCC8; color: #9C907E; font-size: 13px; width: 100px;">Correo</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #E7DCC8; color: #241F1A; font-size: 14px; font-weight: 600;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: #9C907E; font-size: 13px;">Origen</td>
            <td style="padding: 12px 0; color: #241F1A; font-size: 14px;">${origen}</td>
          </tr>
        </table>
        <div style="margin-top: 28px; padding: 16px; background: #2E4A6E; border-radius: 8px; text-align: center;">
          <a href="https://app.supabase.com" style="color: #F7F3EA; font-size: 14px; text-decoration: none;">Ver todos los registros en Supabase →</a>
        </div>
        <p style="color: #9C907E; font-size: 12px; margin-top: 20px; text-align: center;">Aureo — Sistema de gestión de inventario</p>
      </div>
    `,
  });
}
