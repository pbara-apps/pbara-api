import ExecutiveDao from "@/dao/executive";
import NotificationDao, { type Recipient } from "@/dao/notification";
import PortalUserDao from "@/dao/portal-user";

/**
 * Notification service — in-app notifications for admins and chapter officers.
 *
 * Sending never throws: a notification is a side effect, and a failure must
 * not undo or block the action that caused it (e.g. approving members).
 */

export type NotificationContent = {
  type: string;
  title: string;
  message: string;
  link?: string | null;
};

const LIST_LIMIT = 30;

async function send(recipients: Recipient[], content: NotificationContent) {
  try {
    await NotificationDao.createMany(
      recipients.map((r) => ({
        recipientType: r.type,
        recipient: r.id,
        type: content.type,
        title: content.title,
        message: content.message,
        link: content.link ?? null,
      })),
    );
  } catch (error) {
    console.error("[Notification] failed to send:", error);
  }
}

const NotificationService = {
  /** Every super admin (they review members and chapter requests). */
  async notifySuperAdmins(content: NotificationContent) {
    try {
      const ids = await ExecutiveDao.findIdsByRole("super_admin");
      await send(ids.map((id) => ({ type: "executive", id })), content);
    } catch (error) {
      console.error("[Notification] super admin lookup failed:", error);
    }
  },

  /** Every super admin and admin (e.g. registration issues they should look at). */
  async notifyAdmins(content: NotificationContent) {
    try {
      const ids = [
        ...(await ExecutiveDao.findIdsByRole("super_admin")),
        ...(await ExecutiveDao.findIdsByRole("admin")),
      ];
      await send(ids.map((id) => ({ type: "executive", id })), content);
    } catch (error) {
      console.error("[Notification] admin lookup failed:", error);
    }
  },

  /** Presidents and secretaries of the chapters, plus their church counsellors. */
  async notifyChapterOfficers(chapterIds: string[], churchIds: string[], content: NotificationContent) {
    try {
      const ids = await PortalUserDao.findActiveIdsForChapters(chapterIds, churchIds);
      await send(ids.map((id) => ({ type: "portal_user", id })), content);
    } catch (error) {
      console.error("[Notification] officer lookup failed:", error);
    }
  },

  /** Specific portal accounts (e.g. the counsellor who made a request). */
  async notifyPortalUsers(userIds: string[], content: NotificationContent) {
    await send(userIds.map((id) => ({ type: "portal_user", id })), content);
  },

  // ─── Reading (used by both portals) ──────────────────────────────────────

  async list(recipient: Recipient) {
    const [items, unread] = await Promise.all([
      NotificationDao.listFor(recipient, LIST_LIMIT),
      NotificationDao.countUnread(recipient),
    ]);
    return { items, unread };
  },
  async unreadCount(recipient: Recipient) {
    return await NotificationDao.countUnread(recipient);
  },
  async markRead(recipient: Recipient, id: string) {
    await NotificationDao.markRead(recipient, id);
  },
  async markAllRead(recipient: Recipient) {
    await NotificationDao.markAllRead(recipient);
  },
};

export default NotificationService;
