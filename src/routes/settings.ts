import SettingsController from "@/controller/settings";
import requireAuth from "@/middleware/requireAuth";
import requireSuperAdmin from "@/middleware/requireSuperAdmin";
import validate from "@/middleware/validate";
import { updateExecutiveRoleSchema } from "@/schema/settings";
import express from "express";

const router = express.Router();

router.get("/executives", [
  requireAuth,
  requireSuperAdmin,
  SettingsController.getExecutivesWithRoles,
]);
router.patch("/executives/:id/role", [
  requireAuth,
  requireSuperAdmin,
  validate(updateExecutiveRoleSchema),
  SettingsController.updateExecutiveRole,
]);

export default router;
