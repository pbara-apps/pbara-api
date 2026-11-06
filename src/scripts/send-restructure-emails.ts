/**
 * Sends the one-off "one sign-in for everyone" email to accounts moved over
 * by scripts/migrate-accounts.ts. Each account is emailed once.
 *
 *   npm run email:restructure            → dry run: lists who would be emailed
 *   npm run email:restructure -- --send  → sends
 *
 * New accounts created after the migration get the regular welcome email
 * instead (with a one-time password); they are never included here.
 */
import "dotenv/config";
import connectDB from "@/config/db_config";
import { chapterAccessTitle, restructureEmail } from "@/helpers/email-templates";
import { sendMail } from "@/helpers/mailer";
import AccountModel from "@/models/account";
import ChapterModel from "@/models/chapter";
import ChurchModel from "@/models/church";
import { adminAccessTitle } from "@/service/account";
import mongoose from "mongoose";

const SEND = process.argv.includes("--send");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function placeName(access: { role: string; church: unknown; chapter?: unknown | null }) {
  if (access.chapter) {
    const chapter = await ChapterModel.findById(access.chapter).select("name").lean().exec();
    if (chapter?.name) return chapter.name;
  }
  const church = await ChurchModel.findById(access.church).select("name").lean().exec();
  return church?.name ?? "your church";
}

async function main() {
  await connectDB();
  const accounts = await AccountModel.find({
    isActive: true,
    "migration.migratedAt": { $ne: null },
    "migration.emailSentAt": null,
  }).exec();

  console.log(SEND ? "=== SENDING restructure emails ===" : "=== DRY RUN (add --send to send) ===");
  let sent = 0;
  let failed = 0;
  let listed = 0;
  for (const account of accounts) {
    const titles: string[] = [];
    if (account.admin?.active) titles.push(adminAccessTitle(account.admin.role));
    if (account.chapterAccess?.active) {
      titles.push(chapterAccessTitle(account.chapterAccess.role, await placeName(account.chapterAccess)));
    }
    if (titles.length === 0) continue; // no current access: nothing to tell them
    listed++;

    console.log(`  - ${account.name} <${account.email}>: ${titles.join("; ")}${account.migration?.merged ? " [merged]" : ""}`);
    if (!SEND) continue;

    try {
      await sendMail({
        to: account.email,
        ...restructureEmail({
          name: account.name,
          email: account.email,
          accessTitles: titles,
          merged: Boolean(account.migration?.merged),
        }),
      });
      await AccountModel.updateOne({ _id: account._id }, { $set: { "migration.emailSentAt": new Date() } }).exec();
      sent++;
      await sleep(600); // stay under the mail provider's rate limit
    } catch (error) {
      failed++;
      console.error(`    ! failed for ${account.email}:`, error);
    }
  }
  console.log(SEND ? `\nSent ${sent}, failed ${failed}. Re-run to retry failures.` : `\n${listed} account(s) would be emailed.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
