import ChapterDao from "@/dao/chapter";
import ChurchDao from "@/dao/church";
import PortalUserDao from "@/dao/portal-user";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { portalAccountEmail } from "@/helpers/email-templates";
import { httpError } from "@/helpers/http-error";
import { sendMail } from "@/helpers/mailer";
import { hashPassword } from "@/helpers/password-hasher";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import { generateTempPassword } from "@/helpers/temp-password";
import type { PortalRole } from "@/models/portal-user";
import ChapterService from "@/service/chapter";

/**
 * Portal account service — creates and manages chapter portal logins.
 *
 * Who creates which account:
 * - Association admin → the church Counsellor.
 * - Counsellor → each chapter's President and Secretary.
 *
 * Each position has exactly one active holder. Assigning someone new to a
 * position deactivates the previous holder, so they can no longer log in.
 *
 * New accounts (and password resets) get a one-time password by email and
 * `has_changed_password: false`. If the email can't be sent, the one-time
 * password is returned once in the response so the admin/counsellor can
 * pass it on another way.
 */

export type AccountDetails = { name: string; email: string; phone: string };

type PortalUserDoc = NonNullable<Awaited<ReturnType<typeof PortalUserDao.findById>>>;

/** Result of an action that may have sent a one-time password. */
export type CredentialDelivery = {
  emailSent: boolean;
  /** Only present when the email could not be sent. */
  temporaryPassword?: string;
};

/** Safe, client-facing view of an account (never includes the password). */
export function toPublicAccount(user: PortalUserDoc) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    churchId: String(user.church),
    chapterId: user.chapter ? String(user.chapter) : null,
    hasChangedPassword: user.has_changed_password,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

/** Emails the one-time password. Never throws: a failed email is reported instead. */
async function deliverTempPassword(
  user: PortalUserDoc,
  tempPassword: string,
  placeName: string,
): Promise<CredentialDelivery> {
  try {
    const mail = portalAccountEmail({
      name: user.name,
      email: user.email,
      role: user.role,
      placeName,
      tempPassword,
    });
    await sendMail({ to: user.email, ...mail });
    return { emailSent: true };
  } catch (error) {
    console.error("[PortalAccount] one-time password email failed:", error);
    return { emailSent: false, temporaryPassword: tempPassword };
  }
}

/**
 * Puts a person into a position (counsellor of a church, or president/secretary
 * of a chapter). Steps:
 * 1. Same email as the current holder → just update their name/phone.
 * 2. Otherwise make sure the email isn't used by another active account.
 * 3. Create the account (or reactivate an old one with this email) with a
 *    fresh one-time password.
 * 4. Deactivate the previous holder, then email the new holder.
 */
async function fillPosition(opts: {
  role: PortalRole;
  churchId: string;
  chapterId: string | null;
  details: AccountDetails;
  currentHolder: PortalUserDoc | null;
  placeName: string;
}): Promise<{ account: ReturnType<typeof toPublicAccount> } & CredentialDelivery & { replaced: boolean }> {
  const email = opts.details.email.trim().toLowerCase();
  const name = opts.details.name.trim();
  const phone = opts.details.phone.trim();

  // 1. Same person: update contact details only, keep their password.
  if (opts.currentHolder && opts.currentHolder.email === email) {
    const updated = await PortalUserDao.update(String(opts.currentHolder._id), { name, phone });
    return { account: toPublicAccount(updated!), emailSent: false, replaced: false };
  }

  // 2. The email must not belong to someone else's active account.
  const emailOwner = await PortalUserDao.findByEmail(email);
  if (emailOwner?.isActive) {
    throw httpError(409, "This email is already used by another portal account");
  }

  // 3. New account, or reuse an old deactivated one with the same email.
  const tempPassword = generateTempPassword();
  const accountData = {
    name,
    email,
    phone,
    password: await hashPassword(tempPassword),
    role: opts.role,
    church: opts.churchId,
    chapter: opts.chapterId,
  };
  const account = emailOwner
    ? await PortalUserDao.update(String(emailOwner._id), {
        ...accountData,
        has_changed_password: false,
        isActive: true,
      })
    : await PortalUserDao.create(accountData);

  // 4. The previous holder loses access only after the new account exists.
  if (opts.currentHolder) {
    await PortalUserDao.update(String(opts.currentHolder._id), { isActive: false });
  }

  const delivery = await deliverTempPassword(account!, tempPassword, opts.placeName);
  return { account: toPublicAccount(account!), ...delivery, replaced: Boolean(opts.currentHolder) };
}

/** Gives an account a new one-time password and sends it. */
async function resetToTempPassword(user: PortalUserDoc, placeName: string) {
  const tempPassword = generateTempPassword();
  await PortalUserDao.update(String(user._id), {
    password: await hashPassword(tempPassword),
    has_changed_password: false,
  });
  return await deliverTempPassword(user, tempPassword, placeName);
}

async function getChurchOrThrow(churchId: string) {
  const church = await ChurchDao.findById(churchId);
  if (!church) throw httpError(404, "Church not found");
  return church;
}

/** Loads a president/secretary account that belongs to the counsellor's church. */
async function getOfficerInChurch(counsellor: PortalAuthUser, officerId: string) {
  const officer = await PortalUserDao.findById(officerId);
  const isOfficer = officer && (officer.role === "president" || officer.role === "secretary");
  if (!isOfficer || String(officer.church) !== counsellor.churchId) {
    throw httpError(404, "Officer not found");
  }
  return officer;
}

const PortalAccountService = {
  // ─── Association admin: church counsellor ──────────────────────────────

  async getCounsellor(churchId: string) {
    await getChurchOrThrow(churchId);
    const counsellor = await PortalUserDao.findActiveCounsellor(churchId);
    return counsellor ? toPublicAccount(counsellor) : null;
  },

  /** Sets (or replaces) a church's counsellor and emails them a one-time password. */
  async assignCounsellor(churchId: string, details: AccountDetails, actor: AuditActor) {
    const church = await getChurchOrThrow(churchId);
    await ChapterService.ensureDefaultChapter(church);

    const result = await fillPosition({
      role: "counsellor",
      churchId,
      chapterId: null,
      details,
      currentHolder: await PortalUserDao.findActiveCounsellor(churchId),
      placeName: church.name,
    });

    // Keep the counsellor name shown on the church record in step.
    await ChurchDao.updateChurch(churchId, { counsellor: result.account.name });

    await logAudit({
      action: "updated",
      entityType: "portal_account",
      entityId: result.account.id,
      entityTitle: `${church.name} counsellor`,
      actor,
      detail: result.replaced
        ? `Counsellor replaced by ${result.account.name}`
        : `Counsellor set to ${result.account.name}`,
    });
    return result;
  },

  async resendCounsellorPassword(churchId: string, actor: AuditActor) {
    const church = await getChurchOrThrow(churchId);
    const counsellor = await PortalUserDao.findActiveCounsellor(churchId);
    if (!counsellor) throw httpError(404, "This church has no counsellor yet");

    const delivery = await resetToTempPassword(counsellor, church.name);
    await logAudit({
      action: "updated",
      entityType: "portal_account",
      entityId: String(counsellor._id),
      entityTitle: `${church.name} counsellor`,
      actor,
      detail: "One-time password re-sent",
    });
    return delivery;
  },

  // ─── Counsellor: chapter presidents and secretaries ────────────────────

  /** Every chapter in the counsellor's church, with its current president and secretary. */
  async listOfficers(counsellor: PortalAuthUser) {
    const chapters = await ChapterService.listChaptersForUser(counsellor);
    const officers = await PortalUserDao.findActiveOfficersForChapters(
      chapters.map((c) => String(c._id)),
    );
    return chapters.map((chapter) => {
      const forChapter = officers.filter((o) => String(o.chapter) === String(chapter._id));
      const find = (role: PortalRole) => {
        const officer = forChapter.find((o) => o.role === role);
        return officer ? toPublicAccount(officer) : null;
      };
      return {
        chapter: { id: String(chapter._id), name: chapter.name },
        president: find("president"),
        secretary: find("secretary"),
      };
    });
  },

  /** Sets (or replaces) a chapter's president or secretary. */
  async assignChapterOfficer(
    counsellor: PortalAuthUser,
    input: AccountDetails & { chapterId: string; role: "president" | "secretary" },
  ) {
    const chapter = await ChapterService.getAccessibleChapter(counsellor, input.chapterId);
    const result = await fillPosition({
      role: input.role,
      churchId: counsellor.churchId,
      chapterId: String(chapter._id),
      details: input,
      currentHolder: await PortalUserDao.findActiveChapterOfficer(String(chapter._id), input.role),
      placeName: chapter.name,
    });

    await logAudit({
      action: "updated",
      entityType: "portal_account",
      entityId: result.account.id,
      entityTitle: `${chapter.name} ${input.role}`,
      actor: { id: counsellor.id, name: `${counsellor.name} (Counsellor)` },
      detail: `${input.role === "president" ? "President" : "Secretary"} set to ${result.account.name}`,
    });
    return result;
  },

  async resendOfficerPassword(counsellor: PortalAuthUser, officerId: string) {
    const officer = await getOfficerInChurch(counsellor, officerId);
    if (!officer.isActive) throw httpError(400, "This account has been removed");
    const chapter = await ChapterDao.findById(String(officer.chapter));
    return await resetToTempPassword(officer, chapter?.name ?? "your chapter");
  },

  /** Removes an officer's access (e.g. they stepped down without a replacement yet). */
  async removeOfficer(counsellor: PortalAuthUser, officerId: string) {
    const officer = await getOfficerInChurch(counsellor, officerId);
    await PortalUserDao.update(officerId, { isActive: false });
    await logAudit({
      action: "deleted",
      entityType: "portal_account",
      entityId: officerId,
      entityTitle: officer.name,
      actor: { id: counsellor.id, name: `${counsellor.name} (Counsellor)` },
      detail: `${officer.role} access removed`,
    });
  },
};

export default PortalAccountService;
