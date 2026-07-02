import ExecutiveService from "@/service/executive";
import { NextFunction, Request, Response } from "express";

const ExecutiveController = {
  async createExecutive(req: Request, res: Response, next: NextFunction) {
    const executiveBody = req.body;
    try {
      const executive = await ExecutiveService.createExecutive(executiveBody);
      return res
        .status(201)
        .json({ message: "Executive created successfully", data: executive });
    } catch (error) {
      next(error);
    }
  },
  async updateExecutive(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const executiveBody = req.body;
    try {
      const executive = await ExecutiveService.updateExecutive(
        id as string,
        executiveBody,
      );
      return res
        .status(201)
        .json({ message: "Executive updated successfully", data: executive });
    } catch (error) {
      next(error);
    }
  },
  async getAllExecutive(req: Request, res: Response, next: NextFunction) {
    try {
      const executives = await ExecutiveService.getAllExecutive();
      return res
        .status(200)
        .json({ message: "Executives fetched successfully", data: executives });
    } catch (error) {
      next(error);
    }
  },
  async getPublicExecutives(req: Request, res: Response, next: NextFunction) {
    try {
      const executives = await ExecutiveService.getPublicExecutives();
      return res.status(200).json({
        message: "Public executives fetched successfully",
        data: executives,
      });
    } catch (error) {
      next(error);
    }
  },
  async deleteExecutive(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await ExecutiveService.deleteExecutive(id as string);
      return res
        .status(200)
        .json({ message: "Executive deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteExecutivesBulk(req: Request, res: Response, next: NextFunction) {
    const { ids } = req.body;
    try {
      await ExecutiveService.deleteExecutives(ids);
      return res.status(200).json({
        message: "Executives deleted successfully",
        data: { deletedCount: ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
  async createDirectorDesk(req: Request, res: Response, next: NextFunction) {
    const directorDeskBody = req.body;
    try {
      const directorDesk =
        await ExecutiveService.createDirectorDesk(directorDeskBody);
      return res.status(201).json({
        message: "Director desk created successfully",
        data: directorDesk,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default ExecutiveController;
