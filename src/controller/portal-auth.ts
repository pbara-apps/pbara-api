import { asyncHandler } from "@/helpers/async-handler";
import { getPortalUser } from "@/helpers/portal-auth-user";
import AccountAuthService from "@/service/account-auth";
import PortalAuthService from "@/service/portal-auth";

/** Chapter portal profile and password change. Sign-in is shared: POST /auth/login. */
const PortalAuthController = {
  profile: asyncHandler(async (req, res) => {
    const data = await PortalAuthService.getProfile(getPortalUser(req).id);
    res.status(200).json({ message: "Profile fetched successfully", data });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = getPortalUser(req).id;
    await AccountAuthService.changePassword(userId, currentPassword, newPassword);
    const data = await PortalAuthService.getProfile(userId);
    res.status(200).json({ message: "Password changed successfully", data });
  }),
};

export default PortalAuthController;
