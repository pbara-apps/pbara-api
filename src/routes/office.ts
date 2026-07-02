import OfficeController from "@/controller/office";
import requireAuth from "@/middleware/requireAuth";
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
  validate(createOfficeSchema),
  OfficeController.createOffice,
]);
router.post("/create/bulk", [
  requireAuth,
  validate(createOfficeBulkSchema),
  OfficeController.createOfficeBulk,
]);
router.patch("/update/:id", [
  requireAuth,
  validate(updateOfficeSchema),
  OfficeController.updateOffice,
]);
router.delete("/delete/:id", [
  requireAuth,
  validate(idParamSchema),
  OfficeController.deleteOffice,
]);
router.delete("/delete/bulk", [
  requireAuth,
  validate(bulkDeleteSchema),
  OfficeController.deleteOfficesBulk,
]);
router.get("/", [requireAuth, OfficeController.getAllOffice]);

export default router;
