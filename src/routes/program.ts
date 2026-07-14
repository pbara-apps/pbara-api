import ProgramController from "@/controller/program";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { idParamSchema } from "@/schema/common";
import {
  createProgramSchema,
  programSlugParamSchema,
  updateProgramSchema,
} from "@/schema/program";
import express from "express";

const router = express.Router();

router.get("/public", ProgramController.getActive);
router.get(
  "/public/:slug",
  [validate(programSlugParamSchema), ProgramController.getActiveBySlug],
);

router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createProgramSchema),
  ProgramController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateProgramSchema),
  ProgramController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  ProgramController.deactivate,
]);
router.get("/", [requireAuth, ProgramController.getAll]);

export default router;
