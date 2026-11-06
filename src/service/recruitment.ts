import AmbassadorDao from "@/dao/ambassador";
import CounterDao from "@/dao/counter";
import RegistrationDao from "@/dao/registration";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { formatMemberId, isSameDay } from "@/helpers/member-utils";
import NotificationService from "@/service/notification";

/**
 * Recruitment service — the association's review of new members.
 * All actions here are limited to super_admin at the route level.
 *
 * Duplicate check (shown to the reviewer, never blocks anything):
 *   For each member under review, look across the WHOLE association
 *   (every church and chapter, plus other members in the same review queue)
 *   for records with the same normalised name that weren't rejected.
 *   - same name + same date of birth           → "strong" match
 *   - same name, either date of birth missing  → "possible" match
 *   - same name, different dates of birth      → not a match
 *   Each match says whether it is in the same chapter or elsewhere,
 *   so the reviewer can tell a double entry from someone who moved.
 */

type MatchStrength = "strong" | "possible";

type AmbassadorDoc = Awaited<ReturnType<typeof AmbassadorDao.findByNameKeys>>[number];

const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);
const refName = (ref: unknown) => (ref as { name?: string })?.name ?? null;

/** Compares two records with the same name; returns how strong the match is, or null. */
function matchStrength(a: { dateOfBirth?: Date | null }, b: { dateOfBirth?: Date | null }): MatchStrength | null {
  if (!a.dateOfBirth || !b.dateOfBirth) return "possible";
  return isSameDay(a.dateOfBirth, b.dateOfBirth) ? "strong" : null;
}

/** Finds duplicates for a list of members using one database query. */
async function findDuplicates(members: AmbassadorDoc[]) {
  const candidates = await AmbassadorDao.findByNameKeys([
    ...new Set(members.map((m) => m.nameKey)),
  ]);

  const result = new Map<string, ReturnType<typeof describeMatch>[]>();
  for (const member of members) {
    const matches = candidates
      .filter((c) => c.nameKey === member.nameKey && String(c._id) !== String(member._id))
      .map((c) => ({ candidate: c, strength: matchStrength(member, c) }))
      .filter((m): m is { candidate: AmbassadorDoc; strength: MatchStrength } => m.strength !== null)
      .map(({ candidate, strength }) => describeMatch(member, candidate, strength));
    result.set(String(member._id), matches);
  }
  return result;
}

function describeMatch(member: AmbassadorDoc, other: AmbassadorDoc, strength: MatchStrength) {
  return {
    id: String(other._id),
    fullName: other.fullName,
    memberId: other.memberId,
    status: other.status,
    photo: other.photo,
    dateOfBirth: other.dateOfBirth,
    chapterName: refName(other.chapter),
    churchName: refName(other.church),
    strength,
    sameChapter: refId(other.chapter) === refId(member.chapter),
  };
}

type ReviewedMember = { fullName: string; chapter?: unknown; church: unknown };

/** "Tunde Ade, Bola Ige and 3 others" */
function nameList(names: string[]) {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} other${names.length - 2 === 1 ? "" : "s"}`;
}

/**
 * Tells each affected chapter about a review decision. Members are grouped
 * by chapter so each chapter gets one notification, not one per member.
 */
async function notifyChapters(
  members: ReviewedMember[],
  build: (names: string[]) => { type: string; title: string; message: string; link: string },
) {
  const byChapter = new Map<string, { churchId: string; names: string[] }>();
  for (const m of members) {
    const chapterId = refId(m.chapter);
    const group = byChapter.get(chapterId) ?? { churchId: refId(m.church), names: [] };
    group.names.push(m.fullName);
    byChapter.set(chapterId, group);
  }
  for (const [chapterId, group] of byChapter) {
    await NotificationService.notifyChapterOfficers([chapterId], [group.churchId], build(group.names));
  }
}

/**
 * After members are rejected: flag their program registrations as
 * "non_member" and send admins one notification per affected entry.
 */
async function flagRegistrationsAsNonMember(memberIds: string[]) {
  if (memberIds.length === 0) return;
  const registrations = await RegistrationDao.findEntriesForAmbassadors(memberIds);
  if (registrations.length === 0) return;

  await RegistrationDao.setMembershipForAmbassadors(memberIds, "non_member");
  const rejected = new Set(memberIds);
  for (const reg of registrations) {
    const program = (reg.programId as { title?: string })?.title ?? "a program";
    for (const entry of reg.entries.filter((e) => rejected.has(String(e.ambassador)))) {
      await NotificationService.notifyAdmins({
        type: "registration.non_member",
        title: "Registered person is not a member",
        message: `${entry.name} (${entry.registrationCode}) is registered for ${program}, but their membership was not approved. The registration is now marked non-member.`,
        link: "/admin/registrations",
      });
    }
  }
}

const RecruitmentService = {
  /** Members waiting for review (or rejected), each with its duplicate matches. */
  async listRequests(query: { status?: "pending" | "rejected"; search?: string; churchId?: string }) {
    const members = await AmbassadorDao.list(
      {
        statuses: [query.status ?? "pending"],
        search: query.search,
        churchId: query.churchId,
      },
      { createdAt: 1 }, // oldest first, so nobody waits forever
    );
    const duplicates = await findDuplicates(members as unknown as AmbassadorDoc[]);
    return members.map((member) => ({
      ...member.toObject(),
      duplicates: duplicates.get(String(member._id)) ?? [],
    }));
  },

  /**
   * Approves pending members: each gets the next member ID and becomes active.
   * Members that are no longer pending (e.g. approved by someone else a
   * moment ago) are skipped and counted.
   */
  async approve(ids: string[], actor: AuditActor) {
    const members = await AmbassadorDao.findByIds(ids);
    const approvedNames: string[] = [];
    const approvedMembers: ReviewedMember[] = [];
    for (const member of members) {
      if (member.status !== "pending") continue;
      const memberId = formatMemberId(await CounterDao.next("member-id"));
      await AmbassadorDao.update(String(member._id), {
        status: "active",
        memberId,
        changesRequested: false,
        reviewNote: null,
        reviewedBy: actor.id ?? null,
        reviewedAt: new Date(),
        approvedAt: new Date(),
      });
      approvedNames.push(member.fullName);
      approvedMembers.push(member);
    }
    if (approvedNames.length > 0) {
      await logAudit({
        action: "updated",
        entityType: "member",
        entityTitle:
          approvedNames.length === 1 ? approvedNames[0] : `${approvedNames.length} members`,
        actor,
        detail: "Approved as association members",
      });
    }
    // Program registrations made while they were pending now count as members.
    await RegistrationDao.setMembershipForAmbassadors(
      approvedMembers.map((m) => String((m as { _id?: unknown })._id)),
      "member",
    );
    await notifyChapters(approvedMembers, (names) => ({
      type: "members.approved",
      title: "Members approved",
      message: `${nameList(names)} ${names.length === 1 ? "is" : "are"} now approved association member${names.length === 1 ? "" : "s"}.`,
      link: "/chapter/members",
    }));
    return { approved: approvedNames.length, skipped: ids.length - approvedNames.length };
  },

  /**
   * Rejects pending members with a reason the chapter can see.
   * Any program registrations they already have stay, but are flagged
   * "non_member", and admins are told so they can follow up.
   */
  async reject(ids: string[], reason: string, actor: AuditActor) {
    const result = await RecruitmentService.review(ids, actor, {
      update: { status: "rejected", changesRequested: false, reviewNote: reason },
      detail: `Rejected: ${reason}`,
      notify: (names) => ({
        type: "members.rejected",
        title: "Members not approved",
        message: `${nameList(names)} ${names.length === 1 ? "was" : "were"} not approved. Reason: ${reason}`,
        link: "/chapter/members?view=awaiting",
      }),
    });
    await flagRegistrationsAsNonMember(result.updatedIds);
    return result;
  },

  /** Sends pending members back to the chapter to fix something; they stay pending. */
  async requestChanges(ids: string[], note: string, actor: AuditActor) {
    return await RecruitmentService.review(ids, actor, {
      update: { changesRequested: true, reviewNote: note },
      detail: `Changes requested: ${note}`,
      notify: (names) => ({
        type: "members.changes_requested",
        title: "Changes needed",
        message: `The association asked for changes to ${nameList(names)}: ${note}`,
        link: "/chapter/members?view=awaiting",
      }),
    });
  },

  /** Shared by reject / request changes: applies an update to every still-pending member. */
  async review(
    ids: string[],
    actor: AuditActor,
    action: {
      update: Record<string, unknown>;
      detail: string;
      notify: (names: string[]) => { type: string; title: string; message: string; link: string };
    },
  ) {
    const members = await AmbassadorDao.findByIds(ids);
    const pending = members.filter((m) => m.status === "pending");
    for (const member of pending) {
      await AmbassadorDao.update(String(member._id), {
        ...action.update,
        reviewedBy: actor.id ?? null,
        reviewedAt: new Date(),
      });
    }
    if (pending.length > 0) {
      await logAudit({
        action: "updated",
        entityType: "member",
        entityTitle: pending.length === 1 ? pending[0].fullName : `${pending.length} members`,
        actor,
        detail: action.detail,
      });
      await notifyChapters(pending, action.notify);
    }
    return {
      updated: pending.length,
      skipped: ids.length - pending.length,
      updatedIds: pending.map((m) => String(m._id)),
    };
  },

  /** Number of members waiting for review, for the admin sidebar badge. */
  async countPending() {
    return await AmbassadorDao.countByStatus({ statuses: ["pending"] });
  },
};

export default RecruitmentService;
