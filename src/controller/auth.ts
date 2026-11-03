import { asyncHandler } from "@/helpers/async-handler";
import PasswordResetService from "@/service/password-reset";
import { getAuthUser } from "@/helpers/auth-user";
import AuthService from "@/service/auth";
import { NextFunction, Request, Response } from "express";

const AuthController = {
  /** Always answers the same way, whether or not the email has an account. */
  forgotPassword: asyncHandler(async (req, res) => {
    await PasswordResetService.request(req.body.email);
    res.status(200).json({
      message: "If that email belongs to an admin account, a reset link has been sent.",
      data: null,
    });
  }),
  resetPassword: asyncHandler(async (req, res) => {
    await PasswordResetService.reset(req.body.token, req.body.password);
    res.status(200).json({ message: "Password changed. You can now sign in.", data: null });
  }),
  async login(req: Request, res: Response, next: NextFunction) {
    const loginBody = req.body;
    try {
      const { user, token } = await AuthService.login(loginBody);
      return res.status(200).json({
        message: "Login successful",
        status: true,
        data: { user, token },
      });
    } catch (error) {
      next(error);
    }
  },

  async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = getAuthUser(req);
      if (!authUser?.id) {
        return res.status(401).json({ message: "Unauthorized", status: false });
      }

      const user = await AuthService.getProfile(authUser.id);

      return res.status(200).json({
        message: "Profile fetched successfully",
        status: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = getAuthUser(req);
      if (!authUser?.id) {
        return res.status(401).json({ message: "Unauthorized", status: false });
      }

      const user = await AuthService.updateProfile(authUser.id, req.body);

      return res.status(200).json({
        message: "Profile updated successfully",
        status: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AuthController;
