import EventController from "@/controller/event";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createEventSchema, updateEventSchema } from "@/schema/event";
import express from "express";

const router = express.Router();

router.get("/public", EventController.getPublic);
router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createEventSchema),
  EventController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateEventSchema),
  EventController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  EventController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  EventController.deleteBulk,
]);
router.get("/", [requireAuth, EventController.getAll]);

export default router;
