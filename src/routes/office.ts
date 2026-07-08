import OfficeController from "@/controller/office";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import {
  createOfficeBulkSchema,
  createOfficeSchema,
  updateOfficeSchema,
} from "@/schema/office";
import express from "express";
const router = express.Router();

router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createOfficeSchema),
  OfficeController.createOffice,
]);
router.post("/create/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createOfficeBulkSchema),
  OfficeController.createOfficeBulk,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateOfficeSchema),
  OfficeController.updateOffice,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  OfficeController.deleteOffice,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  OfficeController.deleteOfficesBulk,
]);
router.get("/", [requireAuth, OfficeController.getAllOffice]);

export default router;
