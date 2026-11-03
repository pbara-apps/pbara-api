import PortalAuthController from "@/controller/portal-auth";
import ChapterPortalController from "@/controller/chapter-portal";
import { PortalNotificationController as Notifications } from "@/controller/notification";
import {
  requirePasswordChanged,
  requirePortalAuth,
  requirePortalRole,
} from "@/middleware/requirePortalAuth";
import { uploadDocument } from "@/middleware/upload";
import validate from "@/middleware/validate";
import {
  addMembersSchema,
  assignOfficerSchema,
  changePasswordSchema,
  dashboardSchema,
  listMembersSchema,
  memberIdSchema,
  officerIdSchema,
  portalLoginSchema,
  uploadPurposeSchema,
  updateMemberSchema,
} from "@/schema/chapter-portal";
import express from "express";

/**
 * Chapter portal API, used by counsellors, presidents and secretaries.
 * Mounted at /chapter-portal.
 *
 * Access layers:
 * 1. /auth/login is public.
 * 2. /auth/me and /auth/change-password only need a valid login, so a
 *    first-time user can still set their password.
 * 3. Everything else also requires the one-time password to be changed.
 * 4. /officers is limited to counsellors.
 * Which chapters' data a user sees is enforced in the services.
 */
const router = express.Router();

// 1–2. Sign-in and account
router.post("/auth/login", [validate(portalLoginSchema), PortalAuthController.login]);
router.get("/auth/me", [requirePortalAuth, PortalAuthController.profile]);
router.post("/auth/change-password", [
  requirePortalAuth,
  validate(changePasswordSchema),
  PortalAuthController.changePassword,
]);

// 3. Everything below needs a full (password-changed) session.
const portal = express.Router();
portal.use(requirePortalAuth, requirePasswordChanged);

portal.get("/chapters", ChapterPortalController.listChapters);

portal.get("/notifications", Notifications.list);
portal.get("/notifications/unread-count", Notifications.unreadCount);
portal.post("/notifications/read-all", Notifications.markAllRead);
portal.patch("/notifications/:id/read", [validate(memberIdSchema), Notifications.markRead]);
portal.get("/dashboard", [validate(dashboardSchema), ChapterPortalController.dashboard]);

portal.get("/members", [validate(listMembersSchema), ChapterPortalController.listMembers]);
portal.post("/members", [validate(addMembersSchema), ChapterPortalController.addMembers]);
portal.get("/members/:id", [validate(memberIdSchema), ChapterPortalController.getMember]);
portal.patch("/members/:id", [validate(updateMemberSchema), ChapterPortalController.updateMember]);
portal.delete("/members/:id", [validate(memberIdSchema), ChapterPortalController.withdrawMember]);

portal.post("/upload/:purpose", [
  validate(uploadPurposeSchema),
  uploadDocument.single("file"),
  ChapterPortalController.upload,
]);
// 4. Counsellor only: chapter presidents and secretaries.
const counsellorOnly = requirePortalRole(["counsellor"]);
portal.get("/officers", [counsellorOnly, ChapterPortalController.listOfficers]);
portal.post("/officers", [
  counsellorOnly,
  validate(assignOfficerSchema),
  ChapterPortalController.assignOfficer,
]);
portal.post("/officers/:id/resend-password", [
  counsellorOnly,
  validate(officerIdSchema),
  ChapterPortalController.resendOfficerPassword,
]);
portal.delete("/officers/:id", [
  counsellorOnly,
  validate(officerIdSchema),
  ChapterPortalController.removeOfficer,
]);

router.use(portal);

export default router;
