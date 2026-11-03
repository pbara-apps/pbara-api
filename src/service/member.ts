import AmbassadorDao from "@/dao/ambassador";
import RankDao from "@/dao/rank";
import { logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import { cleanName, toNameKey } from "@/helpers/member-utils";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import type { AmbassadorStatus } from "@/models/ambassador";
import ChapterService from "@/service/chapter";
import NotificationService from "@/service/notification";

/**
 * Member service — the chapter portal's view of ambassadors.
 *
 * Rules:
 * - Every member added from the portal starts as `pending`; only a
 *   super_admin can approve them (see recruitment service).
 * - Officers only see and change members in chapters they have access to.
 * - Pending and rejected members can be fully edited. Saving a member that
 *   was rejected or sent back for changes resubmits it for review.
 * - Approved (active) members: name and date of birth are locked, because
 *   they identify the person; contact details, photo and rank can change.
 */

export type RankProgressInput = {
  rankId: string;
  dateReached?: string | null;
  proofUrl?: string | null;
};

export type MemberInput = {
  fullName: string;
  rankId: string;
  dateOfBirth?: string | null;
  photo?: string | null;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
};

/** Which group of members a list request is for. */
export type MemberView = "active" | "awaiting" | "all";

const VIEW_STATUSES: Record<MemberView, AmbassadorStatus[] | undefined> = {
  active: ["active"],
  awaiting: ["pending", "rejected"],
  all: undefined,
};

/** Fields a chapter may still change after a member is approved. */
const ACTIVE_EDITABLE_FIELDS: (keyof MemberInput)[] = [
  "photo",
  "phone",
  "guardianName",
  "guardianPhone",
  "rankId",
];

const emptyToNull = (value?: string | null) => (value?.trim() ? value.trim() : null);

/** Turns portal input into database fields. */
function toRecordFields(input: Partial<MemberInput>) {
  const fields: Record<string, unknown> = {};
  if (input.fullName !== undefined) {
    fields.fullName = cleanName(input.fullName);
    fields.nameKey = toNameKey(input.fullName);
  }
  if (input.rankId !== undefined) fields.rank = input.rankId;
  if (input.dateOfBirth !== undefined) {
    fields.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
  }
  if (input.photo !== undefined) fields.photo = emptyToNull(input.photo);
  if (input.phone !== undefined) fields.phone = emptyToNull(input.phone);
  if (input.guardianName !== undefined) fields.guardianName = emptyToNull(input.guardianName);
  if (input.guardianPhone !== undefined) fields.guardianPhone = emptyToNull(input.guardianPhone);
  return fields;
}

/** Fails if any of the given rank ids doesn't exist. */
async function assertRanksExist(rankIds: string[]) {
  const unique = [...new Set(rankIds)];
  const found = await RankDao.countByIds(unique);
  if (found !== unique.length) throw httpError(400, "One or more ranks are not valid");
}

/** Loads a member and checks it is in a chapter the user can access. */
async function getMemberInScope(user: PortalAuthUser, id: string) {
  const member = await AmbassadorDao.findById(id);
  if (!member) throw httpError(404, "Member not found");
  const chapterId = String((member.chapter as { _id?: unknown })?._id ?? member.chapter);
  const scope = await ChapterService.getScopeChapterIds(user);
  if (!scope.includes(chapterId)) throw httpError(404, "Member not found");
  return member;
}

const actorOf = (user: PortalAuthUser) => ({ id: user.id, name: `${user.name} (${user.role})` });

const MemberService = {
  async listMembers(
    user: PortalAuthUser,
    query: { chapterId?: string; view?: MemberView; search?: string; rankId?: string },
  ) {
    const chapterIds = await ChapterService.resolveChapterIds(user, query.chapterId);
    return await AmbassadorDao.list({
      chapterIds,
      statuses: VIEW_STATUSES[query.view ?? "active"],
      search: query.search,
      rankId: query.rankId,
    });
  },

  async getMember(user: PortalAuthUser, id: string) {
    return await getMemberInScope(user, id);
  },

  /**
   * Adds one or more members to a chapter as `pending`.
   * Used by the single form, the multi-row form and the Excel import.
   */
  async addMembers(user: PortalAuthUser, chapterId: string, members: MemberInput[]) {
    const chapter = await ChapterService.getAccessibleChapter(user, chapterId);
    await assertRanksExist(members.map((m) => m.rankId));

    const docs = members.map((member) => ({
      ...toRecordFields(member),
      // Rank history starts with the rank they joined with.
      rankHistory: [{ rank: member.rankId }],
      church: chapter.church,
      chapter: chapter._id,
      status: "pending",
      submittedBy: user.id,
    }));
    const created = await AmbassadorDao.createMany(docs);

    await logAudit({
      action: "created",
      entityType: "member",
      entityTitle:
        created.length === 1 ? String(created[0].fullName) : `${created.length} members`,
      actor: actorOf(user),
      detail: `Submitted for approval in ${chapter.name}`,
    });
    await NotificationService.notifySuperAdmins({
      type: "members.submitted",
      title: "New members to review",
      message: `${created.length} new member${created.length === 1 ? "" : "s"} from ${chapter.name} ${created.length === 1 ? "is" : "are"} waiting for approval.`,
      link: "/admin/recruitment",
    });
    return created;
  },

  async updateMember(user: PortalAuthUser, id: string, input: Partial<MemberInput>) {
    const member = await getMemberInScope(user, id);
    if (input.rankId) await assertRanksExist([input.rankId]);

    let changes: Partial<MemberInput> = input;
    const extra: Record<string, unknown> = {};

    if (member.status === "active") {
      // Approved members: keep only the fields that may still change.
      changes = Object.fromEntries(
        Object.entries(input).filter(([key]) =>
          ACTIVE_EDITABLE_FIELDS.includes(key as keyof MemberInput),
        ),
      );
    } else if (member.status === "pending" || member.status === "rejected") {
      // Editing a rejected or sent-back member resubmits it for review.
      if (member.status === "rejected" || member.changesRequested) {
        Object.assign(extra, { status: "pending", changesRequested: false, reviewNote: null });
      }
    } else {
      throw httpError(409, `A ${member.status} member can't be edited here`);
    }

    // A new current rank is added to the rank history if it isn't there yet.
    const history = (member.rankHistory ?? []).map((h) => ({
      rank: String((h.rank as { _id?: unknown })?._id ?? h.rank),
      dateReached: h.dateReached,
      proofUrl: h.proofUrl,
    }));
    if (changes.rankId && !history.some((h) => h.rank === changes.rankId)) {
      extra.rankHistory = [...history, { rank: changes.rankId, dateReached: null, proofUrl: null }];
    }

    const updated = await AmbassadorDao.update(id, { ...toRecordFields(changes), ...extra });
    await logAudit({
      action: "updated",
      entityType: "member",
      entityId: id,
      entityTitle: updated?.fullName ?? member.fullName,
      actor: actorOf(user),
      detail: extra.status ? "Edited and resubmitted for approval" : "Details updated",
    });
    if (extra.status) {
      await NotificationService.notifySuperAdmins({
        type: "members.resubmitted",
        title: "Member resubmitted",
        message: `${updated?.fullName ?? member.fullName} was updated by the chapter and is ready for review again.`,
        link: "/admin/recruitment",
      });
    }
    return updated;
  },

  /**
   * Replaces a member's rank history (the ranks they have reached).
   * Entries are sorted into ladder order and duplicates are refused; the
   * highest rank becomes the member's current rank. No approval needed.
   */
  async setRankHistory(user: PortalAuthUser, id: string, entries: RankProgressInput[]) {
    const member = await getMemberInScope(user, id);
    if (member.status === "transferred" || member.status === "inactive") {
      throw httpError(409, `A ${member.status} member's ranks can't be changed here`);
    }

    const rankIds = entries.map((e) => e.rankId);
    if (new Set(rankIds).size !== rankIds.length) {
      throw httpError(400, "Each rank can only appear once");
    }
    const ranks = await RankDao.findByIds(rankIds);
    if (ranks.length !== rankIds.length) throw httpError(400, "One or more ranks are not valid");

    const orderOf = new Map(ranks.map((r) => [String(r._id), r.order ?? Number.MAX_SAFE_INTEGER]));
    const sorted = [...entries].sort((a, b) => orderOf.get(a.rankId)! - orderOf.get(b.rankId)!);
    const rankHistory = sorted.map((e) => ({
      rank: e.rankId,
      dateReached: e.dateReached ? new Date(e.dateReached) : null,
      proofUrl: emptyToNull(e.proofUrl),
    }));
    const currentRankId = sorted[sorted.length - 1].rankId;

    const updated = await AmbassadorDao.update(id, { rankHistory, rank: currentRankId });
    await logAudit({
      action: "updated",
      entityType: "member",
      entityId: id,
      entityTitle: member.fullName,
      actor: actorOf(user),
      detail: `Rank progress updated (${rankHistory.length} rank${rankHistory.length === 1 ? "" : "s"})`,
    });
    return updated;
  },

  /** Only members that were never approved can be withdrawn. */
  async withdrawMember(user: PortalAuthUser, id: string) {
    const member = await getMemberInScope(user, id);
    if (member.status !== "pending" && member.status !== "rejected") {
      throw httpError(409, "Only members awaiting approval or rejected can be removed");
    }
    await AmbassadorDao.deleteById(id);
    await logAudit({
      action: "deleted",
      entityType: "member",
      entityId: id,
      entityTitle: member.fullName,
      actor: actorOf(user),
      detail: "Withdrawn before approval",
    });
  },

  /**
   * Dashboard numbers for one chapter or all chapters in scope:
   * totals, members per rank (every rank listed in ladder order, including
   * ranks with 0 members) and this month's birthdays.
   */
  async getDashboard(user: PortalAuthUser, chapterId?: string) {
    const chapterIds = await ChapterService.resolveChapterIds(user, chapterId);

    const [activeCount, pendingCount, changesRequestedCount, rejectedCount] = await Promise.all([
      AmbassadorDao.countByStatus({ chapterIds, statuses: ["active"] }),
      AmbassadorDao.countByStatus({ chapterIds, statuses: ["pending"] }),
      AmbassadorDao.countChangesRequested(chapterIds),
      AmbassadorDao.countByStatus({ chapterIds, statuses: ["rejected"] }),
    ]);

    const [ranks, rankCounts] = await Promise.all([
      RankDao.findAll(),
      AmbassadorDao.countActiveByRank(chapterIds),
    ]);
    const countByRank = new Map(rankCounts.map((r) => [String(r._id), r.count]));
    const byRank = ranks.map((rank) => ({
      rankId: String(rank._id),
      name: rank.name,
      order: rank.order ?? null,
      count: countByRank.get(String(rank._id)) ?? 0,
    }));

    const month = new Date().getMonth() + 1;
    const birthdays = await AmbassadorDao.findBirthdaysInMonth(chapterIds, month);

    return {
      totals: {
        active: activeCount,
        awaitingApproval: pendingCount,
        changesRequested: changesRequestedCount,
        rejected: rejectedCount,
      },
      byRank,
      birthdays,
    };
  },
};

export default MemberService;
