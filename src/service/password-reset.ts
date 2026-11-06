import { createHash, randomBytes } from "node:crypto";
import { mailConfig } from "@/config/mail";
import AccountDao from "@/dao/account";
import { logAudit } from "@/helpers/audit-logger";
import { passwordResetEmail } from "@/helpers/email-templates";
import { httpError } from "@/helpers/http-error";
import { sendMail } from "@/helpers/mailer";
import PasswordResetModel from "@/models/password-reset";
import AccountAuthService from "@/service/account-auth";

/**
 * "Forgot password" for every account (admins and chapter leaders).
 *
 * 1. request(email): if an active account has that email, create a random token,
 *    store only its hash with a 30-minute expiry, and email a reset link.
 *    The response is the same whether or not the email exists, so the
 *    form can't be used to discover emails.
 * 2. reset(token, password): if the token matches an unexpired record, set
 *    the new password and delete every reset link for that account. Setting a
 *    password this way also counts as "changed", so no forced change follows.
 */

const LINK_LIFETIME_MINUTES = 30;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const PasswordResetService = {
  async request(email: string) {
    const account = await AccountDao.findByEmail(email);
    if (!account?.isActive) return; // same outcome as success, on purpose

    // Only the newest link should work.
    await PasswordResetModel.deleteMany({ account: account._id }).exec();
    const token = randomBytes(32).toString("hex");
    await PasswordResetModel.create({
      account: account._id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + LINK_LIFETIME_MINUTES * 60_000),
    });

    const link = `${mailConfig.portalUrl}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: account.email,
        ...passwordResetEmail({ name: account.name, link, minutes: LINK_LIFETIME_MINUTES }),
      });
    } catch (error) {
      // Don't reveal anything to the requester; just log for the team.
      console.error("[PasswordReset] email failed:", error);
    }
  },

  async reset(token: string, newPassword: string) {
    const record = await PasswordResetModel.findOne({
      tokenHash: sha256(token),
      expiresAt: { $gt: new Date() },
    }).exec();
    if (!record) throw httpError(400, "This reset link is invalid or has expired. Please request a new one.");

    const account = await AccountDao.findById(String(record.account));
    if (!account?.isActive) throw httpError(400, "This reset link is invalid or has expired. Please request a new one.");

    await AccountAuthService.setPasswordFromReset(String(account._id), newPassword);
    await PasswordResetModel.deleteMany({ account: account._id }).exec();
    await logAudit({
      action: "updated",
      entityType: "portal_account",
      entityId: String(account._id),
      entityTitle: account.name,
      actor: { id: String(account._id), name: account.name },
      detail: "Password reset via email link",
    });
  },
};

export default PasswordResetService;
