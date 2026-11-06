import AuthController from "@/controller/auth";
import requireAuth, { requireAccount, requireAuthAllowTempPassword } from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/schema/auth";
import express from "express";

/**
 * Shared sign-in for admins and chapter leaders. Mounted at /auth.
 * - /login, /forgot-password, /reset-password are public.
 * - /session and /change-password work for any account, even with a one-time password.
 * - /me is the admin profile.
 */
const router = express.Router();

router.post("/login", [validate(loginSchema), AuthController.login]);
router.post("/forgot-password", [validate(forgotPasswordSchema), AuthController.forgotPassword]);
router.post("/reset-password", [validate(resetPasswordSchema), AuthController.resetPassword]);

router.get("/session", [requireAccount, AuthController.session]);
router.post("/change-password", [
  requireAccount,
  validate(changePasswordSchema),
  AuthController.changePassword,
]);

router.get("/me", [requireAuthAllowTempPassword, AuthController.profile]);
router.patch("/me", [requireAuth, validate(updateProfileSchema), AuthController.updateProfile]);

export default router;
