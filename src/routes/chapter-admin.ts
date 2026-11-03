import ChapterAdminController from "@/controller/chapter-admin";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import requireSuperAdmin from "@/middleware/requireSuperAdmin";
import validate from "@/middleware/validate";
import {
  adminAchievementListSchema,
  adminMemberListSchema,
  adminMemberStatusSchema,
  adminMemberUpdateSchema,
  adminChapterListSchema,
  approveMembersSchema,
  mergeDuplicateSchema,
  rejectTransferSchema,
  transferIdSchema,
  transferListSchema,
  chapterRequestIdSchema,
  chapterRequestListSchema,
  rejectChapterRequestSchema,
  assignCounsellorSchema,
  churchIdSchema,
  memberIdSchema,
  recruitmentListSchema,
  reviewNoteSchema,
} from "@/schema/chapter-portal";
import express from "express";

/**
 * Association-side chapter administration. Mounted at /chapter-admin.
 *
 * - Church counsellor logins and member corrections: super_admin and admin.
 * - Recruitment Board: every admin role can view; only super_admin can
 *   approve, reject or request changes.
 */
const router = express.Router();

const adminOrSuperAdmin = requireRole(["super_admin", "admin"]);
const canViewBoard = requireRole(["super_admin", "admin", "editor", "finance", "viewer"]);

router.get("/churches/:id/counsellor", [
  requireAuth,
  adminOrSuperAdmin,
  validate(churchIdSchema),
  ChapterAdminController.getCounsellor,
]);
router.put("/churches/:id/counsellor", [
  requireAuth,
  adminOrSuperAdmin,
  validate(assignCounsellorSchema),
  ChapterAdminController.assignCounsellor,
]);
router.post("/churches/:id/counsellor/resend-password", [
  requireAuth,
  adminOrSuperAdmin,
  validate(churchIdSchema),
  ChapterAdminController.resendCounsellorPassword,
]);

// Chapters and new-chapter requests (approving/rejecting: super_admin only)
router.get("/chapters", [
  requireAuth,
  canViewBoard,
  validate(adminChapterListSchema),
  ChapterAdminController.listChapters,
]);
router.get("/chapter-requests", [
  requireAuth,
  canViewBoard,
  validate(chapterRequestListSchema),
  ChapterAdminController.listChapterRequests,
]);
router.post("/chapter-requests/:id/approve", [
  requireAuth,
  requireSuperAdmin,
  validate(chapterRequestIdSchema),
  ChapterAdminController.approveChapterRequest,
]);
router.post("/chapter-requests/:id/reject", [
  requireAuth,
  requireSuperAdmin,
  validate(rejectChapterRequestSchema),
  ChapterAdminController.rejectChapterRequest,
]);

router.get("/overview", [requireAuth, canViewBoard, ChapterAdminController.overview]);

// Member directory: everyone can view; super_admin and admin can correct.
router.get("/members", [requireAuth, canViewBoard, validate(adminMemberListSchema), ChapterAdminController.listMembers]);
router.get("/members/:id", [requireAuth, canViewBoard, validate(memberIdSchema), ChapterAdminController.getMember]);
router.patch("/members/:id", [
  requireAuth,
  adminOrSuperAdmin,
  validate(adminMemberUpdateSchema),
  ChapterAdminController.updateMember,
]);
router.patch("/members/:id/status", [
  requireAuth,
  adminOrSuperAdmin,
  validate(adminMemberStatusSchema),
  ChapterAdminController.setMemberStatus,
]);

router.get("/achievements", [
  requireAuth,
  canViewBoard,
  validate(adminAchievementListSchema),
  ChapterAdminController.listAchievements,
]);

// Transfers (approve/reject and duplicate merge: super_admin only)
router.get("/transfers", [requireAuth, canViewBoard, validate(transferListSchema), ChapterAdminController.listTransfers]);
router.post("/transfers/:id/approve", [requireAuth, requireSuperAdmin, validate(transferIdSchema), ChapterAdminController.approveTransfer]);
router.post("/transfers/:id/reject", [requireAuth, requireSuperAdmin, validate(rejectTransferSchema), ChapterAdminController.rejectTransfer]);
router.post("/recruitment/:id/merge", [requireAuth, requireSuperAdmin, validate(mergeDuplicateSchema), ChapterAdminController.mergeDuplicate]);

router.get("/recruitment", [
  requireAuth,
  canViewBoard,
  validate(recruitmentListSchema),
  ChapterAdminController.listRequests,
]);
router.get("/recruitment/pending-count", [
  requireAuth,
  canViewBoard,
  ChapterAdminController.pendingCount,
]);
router.post("/recruitment/approve", [
  requireAuth,
  requireSuperAdmin,
  validate(approveMembersSchema),
  ChapterAdminController.approve,
]);
router.post("/recruitment/reject", [
  requireAuth,
  requireSuperAdmin,
  validate(reviewNoteSchema),
  ChapterAdminController.reject,
]);
router.post("/recruitment/request-changes", [
  requireAuth,
  requireSuperAdmin,
  validate(reviewNoteSchema),
  ChapterAdminController.requestChanges,
]);

export default router;
