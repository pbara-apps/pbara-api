import type { Recipient } from "@/dao/notification";
import { asyncHandler } from "@/helpers/async-handler";
import { getAuthUser } from "@/helpers/auth-user";
import { getPortalUser } from "@/helpers/portal-auth-user";
import NotificationService from "@/service/notification";
import { Request } from "express";

/**
 * Notification endpoints, shared by both portals. `whoIs` decides whose
 * notifications to use: the admin (Executive) or the chapter portal user.
 */
function makeNotificationController(whoIs: (req: Request) => Recipient) {
  return {
    list: asyncHandler(async (req, res) => {
      const data = await NotificationService.list(whoIs(req));
      res.status(200).json({ message: "Notifications fetched", data });
    }),
    unreadCount: asyncHandler(async (req, res) => {
      const data = await NotificationService.unreadCount(whoIs(req));
      res.status(200).json({ message: "Unread count fetched", data });
    }),
    markRead: asyncHandler(async (req, res) => {
      await NotificationService.markRead(whoIs(req), req.params.id as string);
      res.status(200).json({ message: "Marked as read", data: null });
    }),
    markAllRead: asyncHandler(async (req, res) => {
      await NotificationService.markAllRead(whoIs(req));
      res.status(200).json({ message: "All marked as read", data: null });
    }),
  };
}

export const AdminNotificationController = makeNotificationController((req) => ({
  type: "executive",
  id: getAuthUser(req)!.id,
  aliases: getAuthUser(req)!.aliases,
}));

export const PortalNotificationController = makeNotificationController((req) => ({
  type: "portal_user",
  id: getPortalUser(req).id,
  aliases: getPortalUser(req).aliases,
}));
