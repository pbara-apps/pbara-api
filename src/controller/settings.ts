import SettingsService from "@/service/settings";
import { NextFunction, Request, Response } from "express";

const SettingsController = {
  async getExecutivesWithRoles(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const executives = await SettingsService.getExecutivesWithRoles();
      return res.status(200).json({
        message: "Executives fetched successfully",
        data: executives,
      });
    } catch (error) {
      next(error);
    }
  },
  async updateExecutiveRole(req: Request, res: Response, next: NextFunction) {
    try {
      const executive = await SettingsService.updateExecutiveRole(
        req.params.id as string,
        req.body.role,
      );
      return res.status(200).json({
        message: "Executive role updated successfully",
        data: executive,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default SettingsController;
