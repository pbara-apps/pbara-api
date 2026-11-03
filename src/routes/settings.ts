import SettingsController from "@/controller/settings";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import requireSuperAdmin from "@/middleware/requireSuperAdmin";
import validate from "@/middleware/validate";
import { paymentAccountSchema, updateExecutiveRoleSchema } from "@/schema/settings";
import express from "express";

const router = express.Router();

router.get("/payment-account", SettingsController.getPaymentAccount);
router.put("/payment-account", [
  requireAuth,
  requireSuperAdmin,
  validate(paymentAccountSchema),
  SettingsController.updatePaymentAccount,
]);
router.get("/executives", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  SettingsController.getExecutivesWithRoles,
]);
router.patch("/executives/:id/role", [
  requireAuth,
  requireSuperAdmin,
  validate(updateExecutiveRoleSchema),
  SettingsController.updateExecutiveRole,
]);

export default router;
