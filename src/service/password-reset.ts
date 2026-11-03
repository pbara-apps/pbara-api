import { createHash, randomBytes } from "node:crypto";
import { mailConfig } from "@/config/mail";
import ExecutiveDao from "@/dao/executive";
import { logAudit } from "@/helpers/audit-logger";
import { passwordResetEmail } from "@/helpers/email-templates";
import { httpError } from "@/helpers/http-error";
import { sendMail } from "@/helpers/mailer";
import { hashPassword } from "@/helpers/password-hasher";
import PasswordResetModel from "@/models/password-reset";

/**
 * Admin "forgot password".
 *
 * 1. request(email): if an admin has that email, create a random token,
 *    store only its hash with a 30-minute expiry, and email a reset link.
 *    The response is the same whether or not the email exists, so the
 *    form can't be used to discover admin emails.
 * 2. reset(token, password): if the token matches an unexpired record, set
 *    the new password and delete every reset link for that admin.
 */

const LINK_LIFETIME_MINUTES = 30;
const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const PasswordResetService = {
  async request(email: string) {
    const executive = await ExecutiveDao.findByEmail(email.trim());
    if (!executive?.email) return; // same outcome as success, on purpose

    // Only the newest link should work.
    await PasswordResetModel.deleteMany({ executive: executive._id }).exec();
    const token = randomBytes(32).toString("hex");
    await PasswordResetModel.create({
      executive: executive._id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + LINK_LIFETIME_MINUTES * 60_000),
    });

    const link = `${mailConfig.portalUrl}/reset-password?token=${token}`;
    try {
      await sendMail({
        to: executive.email,
        ...passwordResetEmail({ name: executive.name, link, minutes: LINK_LIFETIME_MINUTES }),
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

    const executive = await ExecutiveDao.findById(String(record.executive));
    if (!executive) throw httpError(400, "This reset link is invalid or has expired. Please request a new one.");

    await ExecutiveDao.updateExecutive(String(executive._id), { password: await hashPassword(newPassword) });
    await PasswordResetModel.deleteMany({ executive: executive._id }).exec();
    await logAudit({
      action: "updated",
      entityType: "executive",
      entityId: String(executive._id),
      entityTitle: executive.name,
      actor: { id: String(executive._id), name: executive.name },
      detail: "Password reset via email link",
    });
  },
};

export default PasswordResetService;
