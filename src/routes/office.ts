import OfficeController from "@/controller/office";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { createOfficeBulkSchema, createOfficeSchema } from "@/schema/office";
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
router.get("/", OfficeController.getAllOffice);

export default router;
