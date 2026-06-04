import ExecutiveController from "@/controller/executive";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { createDirectorDeskSchema } from "@/schema/director-desk";
import { createExecutiveSchema } from "@/schema/executive";
import express from "express";
const router = express.Router();

router.post("/create", [
  requireAuth,
  validate(createExecutiveSchema),
  ExecutiveController.createExecutive,
]);

router.get("/", [requireAuth, ExecutiveController.getAllExecutive]);

router.post("/director-desk/create", [
  requireAuth,
  validate(createDirectorDeskSchema),
  ExecutiveController.createDirectorDesk,
]);
export default router;
