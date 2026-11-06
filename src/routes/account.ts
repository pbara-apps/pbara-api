import AccountController from "@/controller/account";
import requireAuth from "@/middleware/requireAuth";
import requireSuperAdmin from "@/middleware/requireSuperAdmin";
import validate from "@/middleware/validate";
import { accountIdSchema, createAdminAccountSchema, updateAdminAccessSchema } from "@/schema/account";
import express from "express";

/** Admin portal logins. Mounted at /accounts. Super admins only. */
const router = express.Router();
router.use(requireAuth, requireSuperAdmin);

router.get("/admins", AccountController.listAdmins);
router.get("/admins/available-executives", AccountController.executivesWithoutAccount);
router.post("/admins", [validate(createAdminAccountSchema), AccountController.createAdmin]);
router.patch("/admins/:id", [validate(updateAdminAccessSchema), AccountController.updateAdmin]);
router.post("/admins/:id/resend-password", [validate(accountIdSchema), AccountController.resendPassword]);

export default router;
