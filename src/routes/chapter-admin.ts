import ChapterAdminController from "@/controller/chapter-admin";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import requireSuperAdmin from "@/middleware/requireSuperAdmin";
import validate from "@/middleware/validate";
import {
  approveMembersSchema,
  assignCounsellorSchema,
  churchIdSchema,
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
const canViewBoard = requireRole(["super_admin", "admin", "editor", "viewer"]);

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
