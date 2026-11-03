import { AdminNotificationController as C } from "@/controller/notification";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { idParamSchema } from "@/schema/common";
import express from "express";

/** Admin notifications. Mounted at /notifications. */
const router = express.Router();

router.get("/", [requireAuth, C.list]);
router.get("/unread-count", [requireAuth, C.unreadCount]);
router.post("/read-all", [requireAuth, C.markAllRead]);
router.patch("/:id/read", [requireAuth, validate(idParamSchema), C.markRead]);

export default router;
