import AmbassadorDao from "@/dao/ambassador";
import CounterDao from "@/dao/counter";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { formatMemberId, isSameDay } from "@/helpers/member-utils";

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
    return { approved: approvedNames.length, skipped: ids.length - approvedNames.length };
  },

  /**
   * Rejects pending members with a reason the chapter can see.
   */
  async reject(ids: string[], reason: string, actor: AuditActor) {
    return await RecruitmentService.review(ids, actor, {
      update: { status: "rejected", changesRequested: false, reviewNote: reason },
      detail: `Rejected: ${reason}`,
    });
  },

  /** Sends pending members back to the chapter to fix something; they stay pending. */
  async requestChanges(ids: string[], note: string, actor: AuditActor) {
    return await RecruitmentService.review(ids, actor, {
      update: { changesRequested: true, reviewNote: note },
      detail: `Changes requested: ${note}`,
    });
  },

  /** Shared by reject / request changes: applies an update to every still-pending member. */
  async review(
    ids: string[],
    actor: AuditActor,
    action: {
      update: Record<string, unknown>;
      detail: string;
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
    }
    return {
      updated: pending.length,
      skipped: ids.length - pending.length,
    };
  },

  /** Number of members waiting for review, for the admin sidebar badge. */
  async countPending() {
    return await AmbassadorDao.countByStatus({ statuses: ["pending"] });
  },
};

export default RecruitmentService;
