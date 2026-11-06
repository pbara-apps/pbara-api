import { asyncHandler } from "@/helpers/async-handler";
import { getAuthUser } from "@/helpers/auth-user";
import { getAccountId } from "@/middleware/requireAuth";
import AccountAuthService from "@/service/account-auth";
import PasswordResetService from "@/service/password-reset";

const AuthController = {
  login: asyncHandler(async (req, res) => {
    const data = await AccountAuthService.login(req.body.email, req.body.password);
    res.status(200).json({ message: "Login successful", status: true, data });
  }),

  /** What the signed-in account can open (admin and/or chapter portal). */
  session: asyncHandler(async (req, res) => {
    const data = await AccountAuthService.getSession(getAccountId(req));
    res.status(200).json({ message: "Session fetched", data });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const data = await AccountAuthService.changePassword(
      getAccountId(req),
      req.body.currentPassword,
      req.body.newPassword,
    );
    res.status(200).json({ message: "Password changed successfully", data });
  }),

  /** Always answers the same way, whether or not the email has an account. */
  forgotPassword: asyncHandler(async (req, res) => {
    await PasswordResetService.request(req.body.email);
    res.status(200).json({
      message: "If that email belongs to an account, a reset link has been sent.",
      data: null,
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    await PasswordResetService.reset(req.body.token, req.body.password);
    res.status(200).json({ message: "Password changed. You can now sign in.", data: null });
  }),

  profile: asyncHandler(async (req, res) => {
    const data = await AccountAuthService.getAdminProfile(getAuthUser(req)!.id);
    res.status(200).json({ message: "Profile fetched successfully", status: true, data });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const data = await AccountAuthService.updateAdminProfile(getAuthUser(req)!.id, req.body);
    res.status(200).json({ message: "Profile updated successfully", status: true, data });
  }),
};

export default AuthController;
