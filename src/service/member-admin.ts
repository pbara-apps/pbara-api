import AmbassadorDao from "@/dao/ambassador";
import RankDao from "@/dao/rank";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import { cleanName, toNameKey } from "@/helpers/member-utils";
import type { AmbassadorStatus, MemberType } from "@/models/ambassador";

/**
 * Association-side member records: the full directory of members across
 * every church and chapter, with corrections that chapters can't make
 * themselves (e.g. name and date of birth after approval) and the
 * active ⇄ inactive status.
 */

export type AdminMemberUpdate = {
  fullName?: string;
  dateOfBirth?: string | null;
  rankId?: string;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  photo?: string | null;
};

const MAX_PAGE_SIZE = 5000; // large enough for a full Excel export

const MemberAdminService = {
  async list(query: {
    search?: string;
    churchId?: string;
    chapterId?: string;
    rankId?: string;
    status?: AmbassadorStatus;
    memberType?: MemberType;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 25), MAX_PAGE_SIZE);
    return await AmbassadorDao.listPaged(
      {
        search: query.search,
        churchId: query.churchId,
        chapterIds: query.chapterId ? [query.chapterId] : undefined,
        rankId: query.rankId,
        statuses: [query.status ?? "active"],
        memberType: query.memberType,
      },
      page,
      limit,
    );
  },

  async get(id: string) {
    const member = await AmbassadorDao.findById(id);
    if (!member) throw httpError(404, "Member not found");
    return member;
  },

  /** Corrects any detail. Changing the rank also adds it to the rank history. */
  async update(id: string, input: AdminMemberUpdate, actor: AuditActor) {
    const member = await MemberAdminService.get(id);
    const changes: Record<string, unknown> = {};
    if (input.fullName !== undefined) {
      changes.fullName = cleanName(input.fullName);
      changes.nameKey = toNameKey(input.fullName);
    }
    if (input.dateOfBirth !== undefined) changes.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
    for (const key of ["phone", "guardianName", "guardianPhone", "photo"] as const) {
      if (input[key] !== undefined) changes[key] = input[key]?.trim() || null;
    }
    if (input.rankId) {
      if ((await RankDao.countByIds([input.rankId])) !== 1) throw httpError(400, "Invalid rank");
      changes.rank = input.rankId;
      const inHistory = (member.rankHistory ?? []).some(
        (h) => String((h.rank as { _id?: unknown })?._id ?? h.rank) === input.rankId,
      );
      if (!inHistory) {
        changes.rankHistory = [
          ...(member.rankHistory ?? []).map((h) => ({
            rank: (h.rank as { _id?: unknown })?._id ?? h.rank,
            dateReached: h.dateReached,
            proofUrl: h.proofUrl,
          })),
          { rank: input.rankId, dateReached: null, proofUrl: null },
        ];
      }
    }
    const updated = await AmbassadorDao.update(id, changes);
    await logAudit({
      action: "updated",
      entityType: "member",
      entityId: id,
      entityTitle: updated?.fullName ?? member.fullName,
      actor,
      detail: "Details corrected by the association",
    });
    return updated;
  },

  /** Sets an approved member inactive (with a reason) or back to active. */
  async setStatus(id: string, status: "active" | "inactive", reason: string | null, actor: AuditActor) {
    const member = await MemberAdminService.get(id);
    if (member.status !== "active" && member.status !== "inactive") {
      throw httpError(409, "Only approved members can be set active or inactive");
    }
    if (status === "inactive" && !reason?.trim()) throw httpError(400, "Give a reason for setting the member inactive");
    const updated = await AmbassadorDao.update(id, {
      status,
      statusReason: status === "inactive" ? reason!.trim() : null,
    });
    await logAudit({
      action: "updated",
      entityType: "member",
      entityId: id,
      entityTitle: member.fullName,
      actor,
      detail: status === "inactive" ? `Set inactive: ${reason}` : "Set active again",
    });
    return updated;
  },
};

export default MemberAdminService;
