import AdminService from "@/service/admin";
import { NextFunction, Request, Response } from "express";

const AdminController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const dashboard = await AdminService.getDashboard();
      return res
        .status(200)
        .json({ message: "Dashboard fetched successfully", data: dashboard });
    } catch (error) {
      next(error);
    }
  },
  async getDirectorDesk(req: Request, res: Response, next: NextFunction) {
    try {
      const directorDesk = await AdminService.getDirectorDesk();
      return res.status(200).json({
        message: "Director desk fetched successfully",
        data: directorDesk,
      });
    } catch (error) {
      next(error);
    }
  },
  async updateDirectorDesk(req: Request, res: Response, next: NextFunction) {
    try {
      const directorDesk = await AdminService.updateDirectorDesk(req.body);
      return res.status(200).json({
        message: "Director desk updated successfully",
        data: directorDesk,
      });
    } catch (error) {
      next(error);
    }
  },
  async getHeroStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.getHeroStats();
      return res.status(200).json({
        message: "Hero stats fetched successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
  async updateHeroStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await AdminService.updateHeroStats(req.body);
      return res.status(200).json({
        message: "Hero stats updated successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default AdminController;
