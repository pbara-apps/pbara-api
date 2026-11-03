import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import PortalUserDao from "@/dao/portal-user";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import NotificationService from "@/service/notification";

/**
 * New-chapter requests.
 *
 * Rules:
 * 1. A church may ask for a new chapter only when it has MORE than
 *    CHURCH_MEMBERS_BEFORE_NEW_CHAPTER active members.
 * 2. The counsellor creates the request and picks at least
 *    MIN_MEMBERS_IN_NEW_CHAPTER active members from the church's existing
 *    chapters to move into it.
 * 3. A move may not leave any existing chapter empty (a chapter can't
 *    exist without members).
 * 4. A member can only be in one pending request at a time.
 * 5. A super_admin approves or rejects. On approval the rules are checked
 *    again (things may have changed since the request), the chapter
 *    becomes active and the members move into it.
 */
export const CHURCH_MEMBERS_BEFORE_NEW_CHAPTER = 25;
export const MIN_MEMBERS_IN_NEW_CHAPTER = 5;

const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);

/**
 * Checks rules 1–3 for moving `memberIds` out of a church's chapters.
 * Returns the members that are valid to move; throws a clear error otherwise.
 */
async function validateMove(churchId: string, memberIds: string[]) {
  const churchTotal = await AmbassadorDao.countActiveInChurch(churchId);
  if (churchTotal <= CHURCH_MEMBERS_BEFORE_NEW_CHAPTER) {
    throw httpError(
      400,
      `A new chapter needs more than ${CHURCH_MEMBERS_BEFORE_NEW_CHAPTER} active members in the church (it has ${churchTotal}).`,
    );
  }

  const uniqueIds = [...new Set(memberIds)];
  const members = await AmbassadorDao.findBasicByIds(uniqueIds);
  const movable = members.filter((m) => m.status === "active" && refId(m.church) === churchId);
  if (movable.length < MIN_MEMBERS_IN_NEW_CHAPTER) {
    throw httpError(
      400,
      `Pick at least ${MIN_MEMBERS_IN_NEW_CHAPTER} active members from this church (${movable.length} valid).`,
    );
  }

  // Rule 3: count how many leave each source chapter vs. how many it has.
  const leaving = new Map<string, number>();
  for (const m of movable) {
    const chapterId = refId(m.chapter);
    leaving.set(chapterId, (leaving.get(chapterId) ?? 0) + 1);
  }
  const sizes = await AmbassadorDao.countActiveByChapters([...leaving.keys()]);
  for (const [chapterId, count] of leaving) {
    if (count >= (sizes.get(chapterId) ?? 0)) {
      const name = (movable.find((m) => refId(m.chapter) === chapterId)?.chapter as { name?: string })?.name;
      throw httpError(400, `Moving these members would leave ${name ?? "a chapter"} with no members.`);
    }
  }
  return movable;
}

const ChapterRequestService = {
  /**
   * Counsellor's view: every chapter in the church (active, pending and
   * rejected) with member counts, plus whether a new request is allowed.
   */
  async getOverview(counsellor: PortalAuthUser) {
    const chapters = await ChapterDao.findAllByChurch(counsellor.churchId);
    const counts = await AmbassadorDao.countActiveByChapters(chapters.map((c) => String(c._id)));
    const churchActiveMembers = await AmbassadorDao.countActiveInChurch(counsellor.churchId);

    return {
      churchActiveMembers,
      rules: {
        churchMembersBeforeNewChapter: CHURCH_MEMBERS_BEFORE_NEW_CHAPTER,
        minMembersInNewChapter: MIN_MEMBERS_IN_NEW_CHAPTER,
      },
      canRequest: churchActiveMembers > CHURCH_MEMBERS_BEFORE_NEW_CHAPTER,
      chapters: chapters.map((c) => ({
        id: String(c._id),
        name: c.name,
        status: c.status,
        isDefault: c.isDefault,
        activeMembers: counts.get(String(c._id)) ?? 0,
        requestedMemberCount: c.requestedMembers?.length ?? 0,
        reviewNote: c.reviewNote,
        createdAt: c.createdAt,
      })),
    };
  },

  async createRequest(counsellor: PortalAuthUser, input: { name: string; memberIds: string[] }) {
    const name = input.name.trim().replace(/\s+/g, " ");

    const existing = await ChapterDao.findByChurchAndName(counsellor.churchId, name);
    if (existing && existing.status !== "rejected") {
      throw httpError(409, `There is already a chapter called "${existing.name}" in this church.`);
    }

    const movable = await validateMove(counsellor.churchId, input.memberIds);

    // Rule 4: no member in two pending requests.
    const pending = await ChapterDao.findPendingByChurch(counsellor.churchId);
    const alreadyRequested = new Set(pending.flatMap((c) => c.requestedMembers.map(String)));
    const clash = movable.find((m) => alreadyRequested.has(String(m._id)));
    if (clash) {
      throw httpError(409, `${clash.fullName} is already part of another pending chapter request.`);
    }

    // A rejected request with the same name is replaced by the new one.
    if (existing) await ChapterDao.deleteById(String(existing._id));

    const chapter = await ChapterDao.createRequest({
      name,
      church: counsellor.churchId,
      requestedBy: counsellor.id,
      requestedMembers: movable.map((m) => String(m._id)),
    });

    await logAudit({
      action: "created",
      entityType: "chapter_request",
      entityId: String(chapter._id),
      entityTitle: name,
      actor: { id: counsellor.id, name: `${counsellor.name} (Counsellor)` },
      detail: `Requested with ${movable.length} members`,
    });
    await NotificationService.notifySuperAdmins({
      type: "chapter.requested",
      title: "New chapter request",
      message: `A counsellor asked to open "${name}" with ${movable.length} members.`,
      link: "/admin/chapters?tab=requests",
    });
    return chapter;
  },

  /** A counsellor can withdraw their church's pending request. */
  async cancelRequest(counsellor: PortalAuthUser, chapterId: string) {
    const chapter = await ChapterDao.findById(chapterId);
    if (!chapter || String(chapter.church) !== counsellor.churchId || chapter.status !== "pending") {
      throw httpError(404, "Pending request not found");
    }
    await ChapterDao.deleteById(chapterId);
  },

  // ─── Association side ────────────────────────────────────────────────────

  /** Requests (default: pending) with the members that would move. */
  async listRequests(status: "pending" | "rejected" = "pending") {
    const chapters = await ChapterDao.listAll({ status });
    return await Promise.all(
      chapters.map(async (c) => {
        const members = await AmbassadorDao.findBasicByIds(c.requestedMembers.map(String));
        const churchActiveMembers = await AmbassadorDao.countActiveInChurch(refId(c.church));
        return { ...c.toObject(), members, churchActiveMembers };
      }),
    );
  },

  async approve(chapterId: string, actor: AuditActor) {
    const chapter = await ChapterDao.findById(chapterId);
    if (!chapter || chapter.status !== "pending") throw httpError(404, "Pending request not found");

    const churchId = String(chapter.church);
    const movable = await validateMove(churchId, chapter.requestedMembers.map(String));
    await AmbassadorDao.moveToChapter(
      movable.map((m) => String(m._id)),
      chapterId,
    );
    await ChapterDao.update(chapterId, {
      status: "active",
      reviewedBy: actor.id ?? null,
      reviewedAt: new Date(),
      reviewNote: null,
    });

    await logAudit({
      action: "updated",
      entityType: "chapter_request",
      entityId: chapterId,
      entityTitle: chapter.name,
      actor,
      detail: `Approved; ${movable.length} members moved in`,
    });
    if (chapter.requestedBy) {
      await NotificationService.notifyPortalUsers([String(chapter.requestedBy)], {
        type: "chapter.approved",
        title: "New chapter approved",
        message: `"${chapter.name}" is now active with ${movable.length} members. You can now set up its President and Secretary.`,
        link: "/chapter/officers",
      });
    }
    return { moved: movable.length };
  },

  async reject(chapterId: string, note: string, actor: AuditActor) {
    const chapter = await ChapterDao.findById(chapterId);
    if (!chapter || chapter.status !== "pending") throw httpError(404, "Pending request not found");

    await ChapterDao.update(chapterId, {
      status: "rejected",
      reviewNote: note,
      reviewedBy: actor.id ?? null,
      reviewedAt: new Date(),
    });
    await logAudit({
      action: "updated",
      entityType: "chapter_request",
      entityId: chapterId,
      entityTitle: chapter.name,
      actor,
      detail: `Rejected: ${note}`,
    });
    if (chapter.requestedBy) {
      await NotificationService.notifyPortalUsers([String(chapter.requestedBy)], {
        type: "chapter.rejected",
        title: "Chapter request not approved",
        message: `"${chapter.name}" was not approved. Reason: ${note}`,
        link: "/chapter/chapters",
      });
    }
  },

  /**
   * All active chapters for the association's Chapters page: church,
   * active member count and current officers.
   */
  async listActiveChapters(churchId?: string) {
    const chapters = await ChapterDao.listAll({ status: "active", churchId });
    const ids = chapters.map((c) => String(c._id));
    const counts = await AmbassadorDao.countActiveByChapters(ids);
    const officers = await PortalUserDao.findActiveOfficersForChapters(ids);
    return chapters.map((c) => {
      const id = String(c._id);
      const holder = (role: string) => officers.find((o) => String(o.chapter) === id && o.role === role);
      return {
        id,
        name: c.name,
        isDefault: c.isDefault,
        church: c.church,
        activeMembers: counts.get(id) ?? 0,
        president: holder("president")?.name ?? null,
        secretary: holder("secretary")?.name ?? null,
        createdAt: c.createdAt,
      };
    });
  },
};

export default ChapterRequestService;
