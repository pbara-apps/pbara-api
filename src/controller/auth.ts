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
      console.log("Error: ", error);
      next(error);
    }
  },
};

export default AuthController;
