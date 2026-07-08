import MessageController from "@/controller/message";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createMessageSchema, markMessagesReadSchema } from "@/schema/message";
import express from "express";

const router = express.Router();

router.post("/public/create", [
  validate(createMessageSchema),
  MessageController.createPublic,
]);
router.get("/unread-count", [requireAuth, MessageController.getUnreadCount]);
router.patch("/read/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  MessageController.markRead,
]);
router.patch("/read/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(markMessagesReadSchema),
  MessageController.markManyRead,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  MessageController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  MessageController.deleteBulk,
]);
router.get("/", [requireAuth, MessageController.getAll]);

export default router;
