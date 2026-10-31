import { Resend } from "resend";

let client: Resend | null = null;

export function getMailClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("Email is not configured (RESEND_API_KEY missing)"), {
      status: 503,
    });
  }
  if (!client) client = new Resend(apiKey);
  return client;
}

export const isMailConfigured = () => Boolean(process.env.RESEND_API_KEY);

export const mailConfig = {
  // Must be an address on a domain verified in Resend.
  get from() {
    return process.env.MAIL_FROM || "PBA-RA <onboarding@resend.dev>";
  },
  get replyTo() {
    return process.env.MAIL_REPLY_TO || undefined;
  },
  // Public URL of this API, used for unsubscribe links.
  get apiUrl() {
    return (process.env.API_PUBLIC_URL || "http://localhost:3004").replace(/\/$/, "");
  },
  // Public website URL, used for links inside emails.
  get siteUrl() {
    return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  },
};
