import { mailConfig } from "@/config/mail";

const BRAND = "Pentecost Baptist Association Royal Ambassadors (PBARA)";
const PRIMARY = "#1b2452";
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
  const subject = "Welcome! You're subscribed to PBARA updates";
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

export const PORTAL_ROLE_TITLES: Record<string, string> = {
  counsellor: "Counsellor",
  president: "Chapter President",
  secretary: "Chapter Secretary",
};

const loginUrl = () => `${mailConfig.portalUrl}/login`;

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:${GOLD};color:#0f172a;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none">${escapeHtml(label)}</a>`;

const credentialsTable = (email: string, passwordLabel: string, password?: string) => `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:#f8fafc;border-radius:8px;padding:12px 16px">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b">Email</td><td style="padding:4px 0"><strong>${escapeHtml(email)}</strong></td></tr>
        ${
          password
            ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b">${escapeHtml(passwordLabel)}</td><td style="padding:4px 0;font-family:monospace;font-size:16px"><strong>${escapeHtml(password)}</strong></td></tr>`
            : ""
        }
      </table>`;

/** "Chapter President of St Paul's Chapter", "Admin (Editor)", … */
export function chapterAccessTitle(role: string, placeName: string) {
  return `${PORTAL_ROLE_TITLES[role] ?? "Officer"} of ${placeName}`;
}

/**
 * Sent when a NEW account is created (admin or chapter) or its password is
 * reset. Contains a one-time password; the person must change it on first login.
 */
export function newAccountEmail(opts: {
  name: string;
  email: string;
  /** e.g. "Counsellor of First Baptist Church" or "Admin portal (Editor)". */
  accessTitle: string;
  tempPassword: string;
}) {
  const url = loginUrl();
  const subject = "Your PBARA Portal login";
  const html = layout({
    title: subject,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY}">Welcome, ${escapeHtml(opts.name)}</h1>
      <p style="margin:0 0 12px">A PBARA Portal account has been set up for you:
      <strong>${escapeHtml(opts.accessTitle)}</strong>.</p>
      <p style="margin:0 0 8px">Use these details to sign in:</p>
      ${credentialsTable(opts.email, "One-time password", opts.tempPassword)}
      <p style="margin:0 0 24px">You will be asked to choose your own password the first time you sign in.</p>
      ${button(url, "Sign in to the PBARA Portal")}
      <p style="margin:24px 0 0;font-size:13px;color:#64748b">If you weren't expecting this email, you can ignore it.</p>`,
  });
  const text = `Welcome, ${opts.name}.\n\nA PBARA Portal account has been set up for you: ${opts.accessTitle}.\n\nEmail: ${opts.email}\nOne-time password: ${opts.tempPassword}\n\nSign in at ${url}. You will be asked to choose your own password the first time you sign in.`;
  return { subject, html, text };
}

/** Chapter wording kept for existing callers: counsellor / president / secretary. */
export function portalAccountEmail(opts: {
  name: string;
  email: string;
  role: string;
  placeName: string;
  tempPassword: string;
}) {
  return newAccountEmail({
    name: opts.name,
    email: opts.email,
    accessTitle: chapterAccessTitle(opts.role, opts.placeName),
    tempPassword: opts.tempPassword,
  });
}

/** Sent when an EXISTING account gets more access. Their password doesn't change. */
export function accessGrantedEmail(opts: { name: string; email: string; accessTitle: string }) {
  const url = loginUrl();
  const subject = "New access on your PBARA Portal account";
  const html = layout({
    title: subject,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY}">Hello ${escapeHtml(opts.name)}</h1>
      <p style="margin:0 0 12px">Your PBARA Portal account now also has access as
      <strong>${escapeHtml(opts.accessTitle)}</strong>.</p>
      <p style="margin:0 0 24px">Sign in with your usual email and password. If you have more than one kind of access,
      you can choose where to go after signing in.</p>
      ${button(url, "Sign in to the PBARA Portal")}`,
  });
  const text = `Hello ${opts.name},\n\nYour PBARA Portal account now also has access as ${opts.accessTitle}.\nSign in with your usual email and password at ${url}.`;
  return { subject, html, text };
}

/**
 * One-off message for people who already had a login before the shared
 * account system: their password still works, but they must set a new one.
 */
export function restructureEmail(opts: {
  name: string;
  email: string;
  accessTitles: string[];
  /** True when two old logins were merged (either old password works). */
  merged: boolean;
}) {
  const url = loginUrl();
  const subject = "PBARA Portal: one sign-in for everyone";
  const accessList = opts.accessTitles.map((t) => `<li style="margin:0 0 4px">${escapeHtml(t)}</li>`).join("");
  const passwordLine = opts.merged
    ? "You had two separate logins before. They are now one account, and either of your current passwords will work."
    : "Your current password still works.";
  const html = layout({
    title: subject,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY}">Hello ${escapeHtml(opts.name)}</h1>
      <p style="margin:0 0 12px">We are making a short restructure of the PBARA Portal. The admin portal and the
      chapter portal now share <strong>one sign-in page</strong>, and every person has one account.</p>
      <p style="margin:0 0 8px">Your account gives you access as:</p>
      <ul style="margin:0 0 16px;padding-left:20px">${accessList}</ul>
      ${credentialsTable(opts.email, "")}
      <p style="margin:0 0 12px">${escapeHtml(passwordLine)}</p>
      <p style="margin:0 0 24px">The first time you sign in, you will be asked to choose a new password.</p>
      ${button(url, "Sign in to the PBARA Portal")}
      <p style="margin:24px 0 0;font-size:13px;color:#64748b">Thank you for your patience while we improve the portal.</p>`,
  });
  const text = `Hello ${opts.name},\n\nWe are making a short restructure of the PBARA Portal. The admin portal and the chapter portal now share one sign-in page, and every person has one account.\n\nYour access:\n${opts.accessTitles.map((t) => `- ${t}`).join("\n")}\n\nEmail: ${opts.email}\n${passwordLine}\nThe first time you sign in, you will be asked to choose a new password.\n\nSign in at ${url}.`;
  return { subject, html, text };
}

/** "Forgot password" email with a one-time reset link. */
export function passwordResetEmail(opts: { name: string; link: string; minutes: number }) {
  const subject = "Reset your PBARA Portal password";
  const html = layout({
    title: subject,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:22px;color:${PRIMARY}">Reset your password</h1>
      <p style="margin:0 0 12px">Hello ${escapeHtml(opts.name)}, we received a request to reset the password for your PBARA Portal account.</p>
      <p style="margin:0 0 24px">This link works once and expires in ${opts.minutes} minutes.</p>
      <a href="${opts.link}" style="display:inline-block;background:${GOLD};color:#0f172a;font-weight:bold;padding:12px 24px;border-radius:8px;text-decoration:none">Choose a new password</a>
      <p style="margin:24px 0 0;font-size:13px;color:#64748b">If you didn't ask for this, you can ignore this email — your password won't change.</p>`,
  });
  const text = `Hello ${opts.name},\n\nReset your PBARA Portal password here (works once, expires in ${opts.minutes} minutes):\n${opts.link}\n\nIf you didn't ask for this, ignore this email.`;
  return { subject, html, text };
}
