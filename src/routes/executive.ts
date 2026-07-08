import ExecutiveController from "@/controller/executive";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
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
  requireRole(["super_admin", "admin", "editor"]),
  validate(createExecutiveSchema),
  ExecutiveController.createExecutive,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateExecutiveSchema),
  ExecutiveController.updateExecutive,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  ExecutiveController.deleteExecutive,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  ExecutiveController.deleteExecutivesBulk,
]);

router.get("/", [requireAuth, ExecutiveController.getAllExecutive]);

router.post("/director-desk/create", [
  requireAuth,
  requireRole(["super_admin", "admin"]),
  validate(createDirectorDeskSchema),
  ExecutiveController.createDirectorDesk,
]);
export default router;
