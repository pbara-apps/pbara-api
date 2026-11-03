import { EngagementAdminController as C } from "@/controller/engagement";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { censusYearSchema, churchQuerySchema, createAnnouncementSchema, idOnlySchema } from "@/schema/engagement";
import express from "express";

/**
 * Announcements, meeting reports and census progress (admin side).
 * Mounted at /engagement. All admin roles can view; super_admin, admin and
 * editor can publish announcements and send census reminders.
 */
const router = express.Router();
const canView = requireRole(["super_admin", "admin", "editor", "finance", "viewer"]);
const canPublish = requireRole(["super_admin", "admin", "editor"]);

router.get("/announcements", [requireAuth, canView, C.listAnnouncements]);
router.post("/announcements", [requireAuth, canPublish, validate(createAnnouncementSchema), C.createAnnouncement]);
router.delete("/announcements/:id", [requireAuth, canPublish, validate(idOnlySchema), C.deleteAnnouncement]);
router.get("/meetings", [requireAuth, canView, validate(churchQuerySchema), C.listMeetings]);
router.get("/census", [requireAuth, canView, validate(censusYearSchema), C.censusProgress]);
router.post("/census/remind", [requireAuth, canPublish, C.censusRemind]);

export default router;
