import { asyncHandler } from "@/helpers/async-handler";
import { getPortalUser } from "@/helpers/portal-auth-user";
import PortalAuthService from "@/service/portal-auth";

/** Chapter portal sign-in, profile and password change. */
const PortalAuthController = {
  login: asyncHandler(async (req, res) => {
    const data = await PortalAuthService.login(req.body.email, req.body.password);
    res.status(200).json({ message: "Signed in successfully", data });
  }),

  profile: asyncHandler(async (req, res) => {
    const data = await PortalAuthService.getProfile(getPortalUser(req).id);
    res.status(200).json({ message: "Profile fetched successfully", data });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const data = await PortalAuthService.changePassword(
      getPortalUser(req).id,
      currentPassword,
      newPassword,
    );
    res.status(200).json({ message: "Password changed successfully", data });
  }),
};

export default PortalAuthController;
