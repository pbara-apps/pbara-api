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
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  ChurchController.deleteChurch,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  ChurchController.deleteChurchesBulk,
]);
router.get("/", [requireAuth, ChurchController.getAllChurch]);

export default router;
