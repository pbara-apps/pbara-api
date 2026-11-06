import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import ChurchDao from "@/dao/church";
import CounterDao from "@/dao/counter";
import PortalUserDao, { type PortalUserView } from "@/dao/portal-user";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { chapterAccessTitle, PORTAL_ROLE_TITLES } from "@/helpers/email-templates";
import { httpError } from "@/helpers/http-error";
import { cleanName, formatMemberId, toNameKey } from "@/helpers/member-utils";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import type { PortalRole } from "@/models/portal-user";
import { resendTempPassword, upsertAccountWithAccess, type CredentialDelivery } from "@/service/account";
import ChapterService from "@/service/chapter";

/**
 * Portal account service — creates and manages chapter portal logins.
 *
 * Who creates which account:
 * - Association admin → the church Counsellor.
 * - Counsellor → each chapter's President and Secretary.
 *
 * Each position has exactly one active holder. Assigning someone new to a
 * position removes the previous holder's chapter access (their account and
 * any admin access stay).
 *
 * Logins are shared accounts (see service/account.ts): the email is looked
 * up first, and an existing account gets the position added. New accounts
 * (and password resets) get a one-time password by email. If the email
 * can't be sent, the one-time password is returned once in the response so
 * the admin/counsellor can pass it on another way.
 *
 * Every counsellor is also an association member: assigning one creates (or
 * reuses) their counsellor member record. Presidents and secretaries are
 * picked from the chapter's members.
 */

export type AccountDetails = { name: string; email: string; phone: string };

type PortalUserDoc = PortalUserView;

export type { CredentialDelivery };

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
    memberId: user.member ? String(user.member) : null,
    hasChangedPassword: user.has_changed_password,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
  };
}

/**
 * Puts a person into a position (counsellor of a church, or president/secretary
 * of a chapter). Steps:
 * 1. Same email as the current holder → just update their name/phone.
 * 2. Otherwise find the account for this email (or create one) and give it
 *    the position. An existing account keeps its id and password; a new
 *    one gets a one-time password by email. An account that already holds
 *    another chapter position can't take this one.
 * 3. The previous holder loses chapter access (any admin access they have stays).
 */
async function fillPosition(opts: {
  role: PortalRole;
  churchId: string;
  chapterId: string | null;
  details: AccountDetails;
  memberId: string | null;
  currentHolder: PortalUserDoc | null;
  placeName: string;
}): Promise<{ account: ReturnType<typeof toPublicAccount> } & CredentialDelivery & { replaced: boolean }> {
  const email = opts.details.email.trim().toLowerCase();
  const name = opts.details.name.trim();
  const phone = opts.details.phone.trim();

  // 1. Same person: update contact details only, keep their password.
  if (opts.currentHolder && opts.currentHolder.email === email) {
    const update: Record<string, unknown> = { name, phone };
    if (opts.memberId) update.member = opts.memberId;
    const updated = await PortalUserDao.update(String(opts.currentHolder._id), update);
    return { account: toPublicAccount(updated!), emailSent: false, replaced: false };
  }

  // 2. Find or create the account and give it this position.
  const result = await upsertAccountWithAccess({
    name,
    email,
    phone,
    chapterAccess: { role: opts.role, church: opts.churchId, chapter: opts.chapterId },
    member: opts.memberId,
    accessTitle: chapterAccessTitle(opts.role, opts.placeName),
    conflictMessage: (a) => {
      const held = a.chapterAccess?.role ? PORTAL_ROLE_TITLES[a.chapterAccess.role] : "another position";
      return `${a.name} (${a.email}) is already ${held}. Remove them from that position first.`;
    },
  });
  if (opts.memberId && result.account.member && String(result.account.member) !== opts.memberId) {
    // Keep the newest link: this person is now in this position as this member.
    await PortalUserDao.update(String(result.account._id), { member: opts.memberId });
  }

  // 3. The previous holder loses access only after the new holder has it.
  if (opts.currentHolder) {
    await PortalUserDao.update(String(opts.currentHolder._id), { isActive: false });
  }

  const account = await PortalUserDao.findById(String(result.account._id));
  return {
    account: toPublicAccount(account!),
    emailSent: result.emailSent,
    temporaryPassword: result.temporaryPassword,
    replaced: Boolean(opts.currentHolder),
  };
}

/** Gives an account a new one-time password and sends it. */
async function resetToTempPassword(user: PortalUserDoc, placeName: string) {
  return await resendTempPassword(String(user._id), chapterAccessTitle(user.role, placeName));
}

/**
 * Presidents and secretaries are chosen from the chapter's members, so the
 * login is tied to the person's member record.
 */
async function getChapterMemberOrThrow(memberId: string, chapterId: string) {
  const member = await AmbassadorDao.findById(memberId);
  const memberChapter = member ? String((member.chapter as { _id?: unknown })?._id ?? member.chapter) : null;
  if (!member || memberChapter !== chapterId || member.memberType === "counsellor") {
    throw httpError(404, "Member not found in this chapter");
  }
  if (member.status !== "active" && member.status !== "pending") {
    throw httpError(400, `${member.fullName} is not a current member of this chapter`);
  }
  return member;
}

/**
 * Makes sure the counsellor has an active counsellor member record in this
 * church (with a member ID) and that their account links to it.
 * Returns the member record id.
 */
async function ensureCounsellorMember(opts: {
  accountId: string;
  existingMemberId: string | null;
  name: string;
  phone: string;
  photo?: string | null;
  churchId: string;
  actor: AuditActor;
}) {
  const existing = opts.existingMemberId ? await AmbassadorDao.findById(opts.existingMemberId) : null;

  // Already linked to an ambassador record (rare for an adult): keep that link.
  if (existing && existing.memberType !== "counsellor") return String(existing._id);

  const fields: Record<string, unknown> = {
    fullName: cleanName(opts.name),
    nameKey: toNameKey(opts.name),
    phone: opts.phone || null,
    church: opts.churchId,
    ...(opts.photo !== undefined ? { photo: opts.photo || null } : {}),
  };

  if (existing) {
    await AmbassadorDao.update(String(existing._id), {
      ...fields,
      status: "active",
      statusReason: null,
      ...(existing.memberId ? {} : { memberId: formatMemberId(await CounterDao.next("member-id")) }),
    });
    return String(existing._id);
  }

  const now = new Date();
  const created = await AmbassadorDao.create({
    ...fields,
    memberType: "counsellor",
    memberId: formatMemberId(await CounterDao.next("member-id")),
    status: "active",
    chapter: null,
    rank: null,
    reviewedBy: opts.actor.id ?? null,
    reviewedAt: now,
    approvedAt: now,
  });
  await PortalUserDao.update(opts.accountId, { member: created._id });
  await logAudit({
    action: "created",
    entityType: "member",
    entityId: String(created._id),
    entityTitle: created.fullName,
    actor: opts.actor,
    detail: "Counsellor added as an association member",
  });
  return String(created._id);
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
    if (!counsellor) return null;
    const member = counsellor.member ? await AmbassadorDao.findById(String(counsellor.member)) : null;
    return { ...toPublicAccount(counsellor), photo: member?.photo ?? null, memberNumber: member?.memberId ?? null };
  },

  /**
   * Sets (or replaces) a church's counsellor. Their login is found or created
   * by email, and their counsellor member record is created (or updated).
   */
  async assignCounsellor(
    churchId: string,
    details: AccountDetails & { photo?: string | null },
    actor: AuditActor,
  ) {
    const church = await getChurchOrThrow(churchId);
    await ChapterService.ensureDefaultChapter(church);

    const currentHolder = await PortalUserDao.findActiveCounsellor(churchId);
    const result = await fillPosition({
      role: "counsellor",
      churchId,
      chapterId: null,
      details,
      memberId: null,
      currentHolder,
      placeName: church.name,
    });
    const memberId = await ensureCounsellorMember({
      accountId: result.account.id,
      existingMemberId: result.account.memberId,
      name: result.account.name,
      phone: result.account.phone,
      photo: details.photo,
      churchId,
      actor,
    });
    result.account.memberId = memberId;

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
    input: { memberId: string; email: string; phone?: string | null; chapterId: string; role: "president" | "secretary" },
  ) {
    const chapter = await ChapterService.getAccessibleChapter(counsellor, input.chapterId);
    const member = await getChapterMemberOrThrow(input.memberId, String(chapter._id));
    const phone = input.phone?.trim() || member.phone || "";
    if (!phone) throw httpError(400, `Add a phone number for ${member.fullName}`);
    const result = await fillPosition({
      role: input.role,
      churchId: counsellor.churchId,
      chapterId: String(chapter._id),
      details: { name: member.fullName, email: input.email, phone },
      memberId: String(member._id),
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
