import AmbassadorDao from "@/dao/ambassador";
import ChapterDao from "@/dao/chapter";
import TransferModel from "@/models/transfer";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import ChapterService from "@/service/chapter";
import NotificationService from "@/service/notification";

/**
 * Transfers — moving an approved member to another chapter.
 *
 * Rules:
 * - Only active members, and only by an officer of their current chapter.
 * - One pending transfer per member at a time.
 * - The current chapter must keep at least one member.
 * - A super_admin approves; the member then moves (church too, if the
 *   target chapter is in another church) and keeps ID, ranks and history.
 */

const refId = (ref: unknown) => String((ref as { _id?: unknown })?._id ?? ref);
const POPULATE = [
  { path: "member", select: "fullName memberId photo status" },
  { path: "fromChapter", select: "name church", populate: { path: "church", select: "name" } },
  { path: "toChapter", select: "name church", populate: { path: "church", select: "name" } },
  { path: "requestedBy", select: "name role" },
];

const TransferService = {
  /** Active chapters (any church) a member could move to, for the portal's picker. */
  async destinations() {
    const chapters = await ChapterDao.listAll({ status: "active" });
    return chapters.map((c) => ({ id: String(c._id), name: c.name, churchName: (c.church as { name?: string })?.name ?? "" }));
  },

  async request(user: PortalAuthUser, input: { memberId: string; toChapterId: string; reason?: string | null }) {
    const member = await AmbassadorDao.findById(input.memberId);
    if (!member || member.status !== "active") throw httpError(400, "Only approved members can be transferred");
    const fromChapterId = refId(member.chapter);
    await ChapterService.resolveChapterIds(user, fromChapterId); // officer of the current chapter

    if (input.toChapterId === fromChapterId) throw httpError(400, "The member is already in that chapter");
    const toChapter = await ChapterDao.findById(input.toChapterId);
    if (!toChapter || toChapter.status !== "active") throw httpError(404, "Destination chapter not found");

    if (await TransferModel.exists({ member: input.memberId, status: "pending" })) {
      throw httpError(409, `${member.fullName} already has a transfer waiting for approval`);
    }
    const sizes = await AmbassadorDao.countActiveByChapters([fromChapterId]);
    if ((sizes.get(fromChapterId) ?? 0) <= 1) throw httpError(400, "A chapter can't be left without members");

    const transfer = await TransferModel.create({
      member: input.memberId,
      fromChapter: fromChapterId,
      toChapter: input.toChapterId,
      reason: input.reason?.trim() || null,
      requestedBy: user.id,
    });
    await NotificationService.notifySuperAdmins({
      type: "transfer.requested",
      title: "Transfer request",
      message: `${member.fullName} — move to ${toChapter.name} requested.`,
      link: "/admin/transfers",
    });
    return transfer;
  },

  /** Transfers involving the user's chapters (going out or coming in). */
  async listForPortal(user: PortalAuthUser) {
    const scope = await ChapterService.getScopeChapterIds(user);
    return await TransferModel.find({ $or: [{ fromChapter: { $in: scope } }, { toChapter: { $in: scope } }] })
      .populate(POPULATE)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
  },

  async listForAdmin(status: "pending" | "approved" | "rejected") {
    return await TransferModel.find({ status })
      .populate(POPULATE)
      .sort({ createdAt: status === "pending" ? 1 : -1 })
      .limit(500)
      .lean()
      .exec();
  },

  async approve(id: string, actor: AuditActor) {
    const transfer = await TransferModel.findById(id).exec();
    if (!transfer || transfer.status !== "pending") throw httpError(404, "Pending transfer not found");
    const member = await AmbassadorDao.findById(String(transfer.member));
    const toChapter = await ChapterDao.findById(String(transfer.toChapter));
    if (!member || member.status !== "active" || !toChapter || toChapter.status !== "active") {
      throw httpError(409, "The member or the destination chapter is no longer active");
    }

    await AmbassadorDao.moveToChapter([String(member._id)], String(toChapter._id), String(toChapter.church));
    await TransferModel.updateOne(
      { _id: id },
      { status: "approved", reviewedBy: actor.id ?? null, reviewedAt: new Date() },
    ).exec();
    await logAudit({
      action: "updated",
      entityType: "transfer",
      entityId: id,
      entityTitle: member.fullName,
      actor,
      detail: `Moved to ${toChapter.name}`,
    });
    const content = {
      type: "transfer.approved",
      title: "Transfer approved",
      message: `${member.fullName} (${member.memberId}) has moved to ${toChapter.name}.`,
      link: "/chapter/members",
    };
    await NotificationService.notifyChapterOfficers(
      [String(transfer.fromChapter), String(toChapter._id)],
      [refId(member.church), String(toChapter.church)],
      content,
    );
  },

  async reject(id: string, note: string, actor: AuditActor) {
    const transfer = await TransferModel.findById(id).exec();
    if (!transfer || transfer.status !== "pending") throw httpError(404, "Pending transfer not found");
    await TransferModel.updateOne(
      { _id: id },
      { status: "rejected", reviewNote: note, reviewedBy: actor.id ?? null, reviewedAt: new Date() },
    ).exec();
    const member = await AmbassadorDao.findById(String(transfer.member));
    await logAudit({
      action: "updated",
      entityType: "transfer",
      entityId: id,
      entityTitle: member?.fullName ?? "Transfer",
      actor,
      detail: `Rejected: ${note}`,
    });
    if (member) {
      await NotificationService.notifyChapterOfficers([String(transfer.fromChapter)], [refId(member.church)], {
        type: "transfer.rejected",
        title: "Transfer not approved",
        message: `${member.fullName}'s transfer was not approved. Reason: ${note}`,
        link: "/chapter/transfers",
      });
    }
  },

  /**
   * Recruitment Board shortcut for "same person, moved": the new pending
   * entry is removed and the existing member moves into the chapter that
   * submitted it, keeping their ID and history.
   */
  async mergeAsTransfer(pendingId: string, existingId: string, actor: AuditActor) {
    const pending = await AmbassadorDao.findById(pendingId);
    const existing = await AmbassadorDao.findById(existingId);
    if (!pending || pending.status !== "pending") throw httpError(404, "Pending member not found");
    if (!existing || existing.status !== "active") throw httpError(400, "The existing record must be an approved member");

    const toChapterId = refId(pending.chapter);
    const fromChapterId = refId(existing.chapter);
    if (toChapterId !== fromChapterId) {
      await AmbassadorDao.moveToChapter([existingId], toChapterId, refId(pending.church));
    }
    await AmbassadorDao.deleteById(pendingId);
    await logAudit({
      action: "updated",
      entityType: "transfer",
      entityId: existingId,
      entityTitle: existing.fullName,
      actor,
      detail: "Duplicate entry merged; existing member moved to the submitting chapter",
    });
    await NotificationService.notifyChapterOfficers([toChapterId], [refId(pending.church)], {
      type: "transfer.merged",
      title: "Existing member moved to your chapter",
      message: `${existing.fullName} was already a member (${existing.memberId}). Their record has moved to your chapter instead of creating a new one.`,
      link: "/chapter/members",
    });
  },
};

export default TransferService;
