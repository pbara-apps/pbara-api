import PortalAuthController from "@/controller/portal-auth";
import ChapterPortalController from "@/controller/chapter-portal";
import { PortalNotificationController as Notifications } from "@/controller/notification";
import { PortalFinanceController as Finance } from "@/controller/finance";
import { portalBillsSchema, submitPaymentSchema } from "@/schema/finance";
import { EngagementPortalController as Engagement } from "@/controller/engagement";
import {
  censusStatusSchema,
  chapterQuerySchema,
  createMeetingSchema,
  idOnlySchema,
  submitCensusSchema,
  updateMeetingSchema,
} from "@/schema/engagement";
import {
  requirePasswordChanged,
  requirePortalAuth,
  requirePortalRole,
} from "@/middleware/requirePortalAuth";
import { uploadDocument } from "@/middleware/upload";
import validate from "@/middleware/validate";
import {
  achievementIdSchema,
  addMembersSchema,
  createAchievementSchema,
  listAchievementsSchema,
  updateAchievementSchema,
  assignOfficerSchema,
  chapterRequestIdSchema,
  createChapterRequestSchema,
  changePasswordSchema,
  dashboardSchema,
  listMembersSchema,
  memberIdSchema,
  officerIdSchema,
  portalRegistrationListSchema,
  portalRegistrationSchema,
  registeredMembersSchema,
  rankHistorySchema,
  requestTransferSchema,
  uploadPurposeSchema,
  updateMemberSchema,
} from "@/schema/chapter-portal";
import express from "express";

/**
 * Chapter portal API, used by counsellors, presidents and secretaries.
 * Mounted at /chapter-portal.
 *
 * Access layers:
 * 1. Sign-in is shared with the admin portal: POST /auth/login.
 * 2. /auth/me and /auth/change-password only need a valid login, so a
 *    first-time user can still set their password.
 * 3. Everything else also requires the one-time password to be changed.
 * 4. /officers is limited to counsellors.
 * Which chapters' data a user sees is enforced in the services.
 */
const router = express.Router();

// 1–2. Sign-in and account
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
portal.put("/members/:id/rank-history", [validate(rankHistorySchema), ChapterPortalController.setRankHistory]);

portal.get("/programs", ChapterPortalController.listPrograms);
portal.get("/programs/:id/registered", [validate(registeredMembersSchema), ChapterPortalController.registeredMembers]);
portal.get("/registrations", [validate(portalRegistrationListSchema), ChapterPortalController.listRegistrations]);
portal.post("/registrations", [validate(portalRegistrationSchema), ChapterPortalController.register]);

portal.get("/achievements", [validate(listAchievementsSchema), ChapterPortalController.listAchievements]);
portal.post("/achievements", [validate(createAchievementSchema), ChapterPortalController.createAchievement]);
portal.patch("/achievements/:id", [validate(updateAchievementSchema), ChapterPortalController.updateAchievement]);
portal.delete("/achievements/:id", [validate(achievementIdSchema), ChapterPortalController.deleteAchievement]);

portal.get("/dues", [validate(portalBillsSchema), Finance.bills]);
portal.post("/dues/payments", [validate(submitPaymentSchema), Finance.submitPayment]);

portal.get("/transfers", ChapterPortalController.listTransfers);
portal.get("/transfers/destinations", ChapterPortalController.transferDestinations);
portal.post("/transfers", [validate(requestTransferSchema), ChapterPortalController.requestTransfer]);

portal.get("/announcements", Engagement.listAnnouncements);
portal.post("/announcements/:id/read", [validate(idOnlySchema), Engagement.readAnnouncement]);
portal.get("/meetings", [validate(chapterQuerySchema), Engagement.listMeetings]);
portal.post("/meetings", [validate(createMeetingSchema), Engagement.createMeeting]);
portal.patch("/meetings/:id", [validate(updateMeetingSchema), Engagement.updateMeeting]);
portal.delete("/meetings/:id", [validate(idOnlySchema), Engagement.deleteMeeting]);
portal.get("/members/:id/attendance", [validate(idOnlySchema), Engagement.memberAttendance]);
portal.get("/census", [validate(censusStatusSchema), Engagement.censusStatus]);
portal.post("/census", [validate(submitCensusSchema), Engagement.submitCensus]);

// 4. Counsellor only: chapter presidents and secretaries.
const counsellorOnly = requirePortalRole(["counsellor"]);
portal.get("/officers", [counsellorOnly, ChapterPortalController.listOfficers]);

portal.get("/chapter-requests/overview", [counsellorOnly, ChapterPortalController.chapterOverview]);
portal.post("/chapter-requests", [
  counsellorOnly,
  validate(createChapterRequestSchema),
  ChapterPortalController.createChapterRequest,
]);
portal.delete("/chapter-requests/:id", [
  counsellorOnly,
  validate(chapterRequestIdSchema),
  ChapterPortalController.cancelChapterRequest,
]);
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
