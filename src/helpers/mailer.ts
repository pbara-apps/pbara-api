import type { CreateBatchOptions } from "resend";
import { getMailClient, mailConfig } from "@/config/mail";

type Mail = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
};

const BATCH_SIZE = 100; // Resend batch API limit
const BATCH_DELAY_MS = 600; // stay under Resend's default rate limit

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const toPayload = (m: Mail) => ({
  from: mailConfig.from,
  to: [m.to],
  subject: m.subject,
  html: m.html,
  ...(m.text ? { text: m.text } : {}),
  ...(m.headers ? { headers: m.headers } : {}),
  ...(mailConfig.replyTo ? { replyTo: mailConfig.replyTo } : {}),
});

export async function sendMail(mail: Mail) {
  const { data, error } = await getMailClient().emails.send(toPayload(mail));
  if (error) {
    throw Object.assign(new Error(`Email failed: ${error.message}`), { status: 502 });
  }
  return data;
}

/** Sends one email per recipient in batches of 100. Never throws for send errors. */
export async function sendBulk(mails: Mail[]) {
  const client = getMailClient();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < mails.length; i += BATCH_SIZE) {
    const chunk = mails.slice(i, i + BATCH_SIZE);
    try {
      const { data, error } = await client.batch.send(
        chunk.map(toPayload) as CreateBatchOptions,
      );
      if (error) {
        failed += chunk.length;
        errors.push(error.message);
      } else {
        sent += data?.data?.length ?? chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      errors.push((err as Error).message);
    }
    if (i + BATCH_SIZE < mails.length) await sleep(BATCH_DELAY_MS);
  }

  if (errors.length) console.error("[Mail] bulk send errors:", errors);
  return { sent, failed, errors };
}
