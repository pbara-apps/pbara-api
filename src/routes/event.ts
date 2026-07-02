import EventController from "@/controller/event";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createEventSchema, updateEventSchema } from "@/schema/event";
import express from "express";

const router = express.Router();

router.get("/public", EventController.getPublic);
router.post("/create", [
  requireAuth,
  validate(createEventSchema),
  EventController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  validate(updateEventSchema),
  EventController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  validate(idParamSchema),
  EventController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  validate(bulkDeleteSchema),
  EventController.deleteBulk,
]);
router.get("/", [requireAuth, EventController.getAll]);

export default router;
