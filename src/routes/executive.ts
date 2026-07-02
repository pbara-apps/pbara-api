import ExecutiveController from "@/controller/executive";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createDirectorDeskSchema } from "@/schema/director-desk";
import {
  createExecutiveSchema,
  updateExecutiveSchema,
} from "@/schema/executive";
import express from "express";
const router = express.Router();

router.get("/public", ExecutiveController.getPublicExecutives);

router.post("/create", [
  requireAuth,
  validate(createExecutiveSchema),
  ExecutiveController.createExecutive,
]);
router.patch("/update/:id", [
  requireAuth,
  validate(updateExecutiveSchema),
  ExecutiveController.updateExecutive,
]);
router.delete("/delete/:id", [
  requireAuth,
  validate(idParamSchema),
  ExecutiveController.deleteExecutive,
]);
router.delete("/delete/bulk", [
  requireAuth,
  validate(bulkDeleteSchema),
  ExecutiveController.deleteExecutivesBulk,
]);

router.get("/", [requireAuth, ExecutiveController.getAllExecutive]);

router.post("/director-desk/create", [
  requireAuth,
  validate(createDirectorDeskSchema),
  ExecutiveController.createDirectorDesk,
]);
export default router;
