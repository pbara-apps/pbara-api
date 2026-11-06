import SettingsController from "@/controller/settings";
import requireAuth from "@/middleware/requireAuth";
import requireSuperAdmin from "@/middleware/requireSuperAdmin";
import validate from "@/middleware/validate";
import { paymentAccountSchema } from "@/schema/settings";
import express from "express";

const router = express.Router();

router.get("/payment-account", SettingsController.getPaymentAccount);
router.put("/payment-account", [
  requireAuth,
  requireSuperAdmin,
  validate(paymentAccountSchema),
  SettingsController.updatePaymentAccount,
]);
export default router;
