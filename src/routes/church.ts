import ChurchController from "@/controller/church";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import {
  createBulkChurchSchema,
  createChurchSchema,
  updateChurchSchema,
} from "@/schema/church";
import express from "express";
const router = express.Router();

router.get("/public", ChurchController.getPublicChurches);
/** Current church counsellors for the public leaders page (no contact details). */
router.get("/counsellors/public", ChurchController.getPublicCounsellors);

router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createChurchSchema),
  ChurchController.createChurch,
]);
router.post("/create/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createBulkChurchSchema),
  ChurchController.createBulkChurch,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateChurchSchema),
  ChurchController.updateChurch,
]);
// Must come before "/delete/:id", otherwise "bulk" is treated as an id.
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  ChurchController.deleteChurchesBulk,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  ChurchController.deleteChurch,
]);
router.get("/", [requireAuth, ChurchController.getAllChurch]);

export default router;
