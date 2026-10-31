import { isMailConfigured } from "@/config/mail";
import NewsletterDao from "@/dao/newsletter";
import SubscriberDao from "@/dao/subscriber";
import type { AuditActor } from "@/helpers/audit-logger";
import { sanitizeRichText } from "@/helpers/content-sanitizer";
import {
  newsletterEmail,
  unsubscribeHeaders,
  welcomeEmail,
} from "@/helpers/email-templates";
import { sendBulk, sendMail } from "@/helpers/mailer";

const SubscriberService = {
  async subscribe(rawEmail: string, source?: string) {
    const email = rawEmail.trim().toLowerCase();
    const existing = await SubscriberDao.findByEmail(email);
    const subscriber = await SubscriberDao.subscribe(email, source);

    // Welcome new (or returning) subscribers. A mail failure shouldn't fail the signup.
    const shouldWelcome = !existing || !existing.is_active;
    if (shouldWelcome && isMailConfigured() && subscriber?.unsubscribe_token) {
      try {
        const mail = welcomeEmail(subscriber.unsubscribe_token);
        await sendMail({
          to: email,
          ...mail,
          headers: unsubscribeHeaders(subscriber.unsubscribe_token),
        });
      } catch (err) {
        console.error("[Mail] welcome email failed:", err);
      }
    }
    return subscriber;
  },

  async unsubscribe(token: string) {
    if (!token) return null;
    return await SubscriberDao.unsubscribeByToken(token);
  },

  async getAll() {
    return await SubscriberDao.findAll();
  },

  async delete(id: string) {
    const subscriber = await SubscriberDao.findById(id);
    if (!subscriber) {
      throw Object.assign(new Error("Subscriber not found"), { status: 404 });
    }
    await SubscriberDao.delete(id);
  },

  async deleteMany(ids: string[]) {
    await SubscriberDao.deleteMany(ids);
    return { deletedCount: ids.length };
  },

  async sendTestNewsletter(input: { subject: string; content: string; to: string }) {
    const contentHtml = sanitizeRichText(input.content);
    const mail = newsletterEmail({
      subject: input.subject,
      contentHtml,
      token: "test-preview",
    });
    await sendMail({ to: input.to, subject: `[TEST] ${mail.subject}`, html: mail.html });
    return { to: input.to };
  },

  async sendNewsletter(input: { subject: string; content: string }, actor?: AuditActor) {
    const contentHtml = sanitizeRichText(input.content);
    if (!contentHtml) {
      throw Object.assign(new Error("Newsletter content is empty"), { status: 400 });
    }

    const recipients = await SubscriberDao.findActiveRecipients();
    if (recipients.length === 0) {
      throw Object.assign(new Error("There are no active subscribers to send to"), {
        status: 400,
      });
    }

    const record = await NewsletterDao.create({
      subject: input.subject,
      content: contentHtml,
      status: "sending",
      recipient_count: recipients.length,
      sent_by: actor?.id ?? null,
      sent_by_name: actor?.name ?? null,
    });

    const result = await sendBulk(
      recipients.map(({ email, token }) => {
        const mail = newsletterEmail({ subject: input.subject, contentHtml, token });
        return { to: email, ...mail, headers: unsubscribeHeaders(token) };
      }),
    );

    const status =
      result.failed === 0 ? "sent" : result.sent === 0 ? "failed" : "partial";
    return await NewsletterDao.update(String(record._id), {
      status,
      sent_count: result.sent,
      failed_count: result.failed,
    });
  },

  async getNewsletters() {
    return await NewsletterDao.findRecent(20);
  },
};

export default SubscriberService;
