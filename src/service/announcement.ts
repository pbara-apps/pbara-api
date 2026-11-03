import PortalUserDao from "@/dao/portal-user";
import { AuditActor, logAudit } from "@/helpers/audit-logger";
import { httpError } from "@/helpers/http-error";
import type { PortalAuthUser } from "@/helpers/portal-auth-user";
import AnnouncementModel from "@/models/announcement";
import NotificationService from "@/service/notification";

/**
 * Announcements from the association to chapter portal users.
 * Publishing also sends each recipient an in-app notification.
 */

/** Query matching announcements a portal user should see. */
const visibleTo = (user: PortalAuthUser): Record<string, unknown> => ({
  $or: [{ audience: "all" }, { audience: "selected", targetChurches: user.churchId }],
});

const AnnouncementService = {
  async create(
    input: { title: string; body: string; audience: "all" | "selected"; churchIds?: string[] },
    actor: AuditActor,
  ) {
    if (input.audience === "selected" && !input.churchIds?.length) {
      throw httpError(400, "Select at least one church");
    }
    const announcement = await AnnouncementModel.create({
      title: input.title,
      body: input.body,
      audience: input.audience,
      targetChurches: input.audience === "selected" ? input.churchIds : [],
      createdBy: actor.id ?? null,
    });
    await logAudit({
      action: "created",
      entityType: "announcement",
      entityId: String(announcement._id),
      entityTitle: input.title,
      actor,
    });
    const recipients = await PortalUserDao.findActiveIdsByChurches(
      input.audience === "all" ? "all" : input.churchIds!,
    );
    await NotificationService.notifyPortalUsers(recipients, {
      type: "announcement",
      title: `Announcement: ${input.title}`,
      message: input.body.slice(0, 140) + (input.body.length > 140 ? "…" : ""),
      link: "/chapter/announcements",
    });
    return announcement;
  },

  /** Admin list: each announcement with how many recipients have read it. */
  async listForAdmin() {
    const items = await AnnouncementModel.find()
      .populate("targetChurches", "name")
      .populate("reads.user", "name role")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
    return await Promise.all(
      items.map(async (a) => {
        const audienceIds =
          a.audience === "all"
            ? await PortalUserDao.findActiveIdsByChurches("all")
            : await PortalUserDao.findActiveIdsByChurches(a.targetChurches.map((c) => String((c as { _id?: unknown })._id ?? c)));
        return { ...a, recipientCount: audienceIds.length, readCount: a.reads.length };
      }),
    );
  },

  async remove(id: string, actor: AuditActor) {
    const a = await AnnouncementModel.findByIdAndDelete(id).exec();
    if (!a) throw httpError(404, "Announcement not found");
    await logAudit({ action: "deleted", entityType: "announcement", entityId: id, entityTitle: a.title, actor });
  },

  /** Portal list, newest first, with whether this user has read each one. */
  async listForPortal(user: PortalAuthUser) {
    const items = await AnnouncementModel.find(visibleTo(user))
      .select("title body audience reads createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
    return items.map(({ reads, ...a }) => ({ ...a, read: reads.some((r) => String(r.user) === user.id) }));
  },

  /** Records that the user opened the announcement (once). */
  async markRead(user: PortalAuthUser, id: string) {
    await AnnouncementModel.updateOne(
      { _id: id, ...visibleTo(user), "reads.user": { $ne: user.id } },
      { $push: { reads: { user: user.id, readAt: new Date() } } },
    ).exec();
  },
};

export default AnnouncementService;
