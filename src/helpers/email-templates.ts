import { mailConfig } from "@/config/mail";

const BRAND = "Royal Ambassadors of Nigeria (PBA-RA)";
const PRIMARY = "#1e3a8a";
const GOLD = "#d4a017";

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const unsubscribeUrl = (token: string) =>
  `${mailConfig.apiUrl}/subscriber/unsubscribe?token=${encodeURIComponent(token)}`;

/** Headers that let Gmail/Outlook show a one-click "Unsubscribe" button. */
export const unsubscribeHeaders = (token: string) => ({
  "List-Unsubscribe": `<${unsubscribeUrl(token)}>`,
  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
});

function layout(opts: { title: string; bodyHtml: string; token?: string }) {
  const footerUnsub = opts.token
    ? `<p style="margin:8px 0 0">You're receiving this because you subscribed on our website.
         <a href="${unsubscribeUrl(opts.token)}" style="color:#64748b">Unsubscribe</a></p>`
    : "";
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
        <tr><td style="background:${PRIMARY};padding:20px 28px;border-bottom:4px solid ${GOLD}">
          <a href="${mailConfig.siteUrl}" style="color:#ffffff;text-decoration:none;font-size:18px;font-weight:bold">${BRAND}</a>
        </td></tr>
        <tr><td style="padding:28px;font-size:15px;line-height:1.6">
          ${opts.bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 28px;background:#f8fafc;font-size:12px;color:#64748b;line-height:1.5">
          <p style="margin:0">${BRAND} · <a href="${mailConfig.siteUrl}" style="color:#64748b">${mailConfig.siteUrl.replace(/^https?:\/\//, "")}</a></p>
          ${footerUnsub}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function welcomeEmail(token: string) {
  const subject = "Welcome! You're subscribed to PBA-RA updates";
  const html = layout({
    title: subject,
    token,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY}">Thanks for subscribing!</h1>
      <p style="margin:0 0 12px">You'll now receive our announcements, program schedules and
      motivational content straight to your inbox.</p>
      <p style="margin:0 0 24px">In the meantime, see what's coming up:</p>
      <a href="${mailConfig.siteUrl}/events" style="display:inline-block;background:${GOLD};color:#0f172a;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none">View upcoming events</a>`,
  });
  const text = `Thanks for subscribing to ${BRAND} updates!\n\nUpcoming events: ${mailConfig.siteUrl}/events\n\nUnsubscribe: ${unsubscribeUrl(token)}`;
  return { subject, html, text };
}

/** `contentHtml` must already be sanitized. */
export function newsletterEmail(opts: { subject: string; contentHtml: string; token: string }) {
  return {
    subject: opts.subject,
    html: layout({
      title: opts.subject,
      token: opts.token,
      bodyHtml: `<h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY}">${escapeHtml(opts.subject)}</h1>
        <div>${opts.contentHtml}</div>`,
    }),
  };
}

export function unsubscribePage(ok: boolean) {
  const title = ok ? "You've been unsubscribed" : "Link not valid";
  const msg = ok
    ? "You won't receive any more newsletter emails from us. Changed your mind? You can subscribe again on our website at any time."
    : "This unsubscribe link is invalid or has expired. If you keep receiving emails, please contact us.";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;color:#0f172a">
  <div style="max-width:480px;margin:64px auto;background:#fff;border-radius:12px;padding:32px;text-align:center;border-top:4px solid ${GOLD}">
    <h1 style="font-size:22px;color:${PRIMARY};margin:0 0 12px">${title}</h1>
    <p style="line-height:1.6;margin:0 0 24px">${msg}</p>
    <a href="${mailConfig.siteUrl}" style="color:${PRIMARY};font-weight:bold">Back to the website</a>
  </div>
</body></html>`;
}
