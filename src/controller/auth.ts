import { getAuthUser } from "@/helpers/auth-user";
import AuthService from "@/service/auth";
import { NextFunction, Request, Response } from "express";

const AuthController = {
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
};

export default AuthController;
