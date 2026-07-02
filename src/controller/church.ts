import ChurchService from "@/service/church";
import { NextFunction, Request, Response } from "express";

const ChurchController = {
  async createChurch(req: Request, res: Response, next: NextFunction) {
    const churchBody = req.body;
    try {
      const church = await ChurchService.createChurch(churchBody);
      return res
        .status(201)
        .json({ message: "Church created successfully", data: church });
    } catch (error) {
      next(error);
    }
  },
  async createBulkChurch(req: Request, res: Response, next: NextFunction) {
    const churchBody = req.body;
    try {
      const church = await ChurchService.createBulkChurch(churchBody);
      return res
        .status(201)
        .json({ message: "Church created successfully", data: church });
    } catch (error) {
      next(error);
    }
  },
  async getAllChurch(req: Request, res: Response, next: NextFunction) {
    try {
      const churches = await ChurchService.getAllChurch();
      return res
        .status(200)
        .json({ message: "Churches fetched successfully", data: churches });
    } catch (error) {
      next(error);
    }
  },
  async getPublicChurches(req: Request, res: Response, next: NextFunction) {
    try {
      const churches = await ChurchService.getPublicChurches();
      return res.status(200).json({
        message: "Public chapters fetched successfully",
        data: churches,
      });
    } catch (error) {
      next(error);
    }
  },
  async updateChurch(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const church = await ChurchService.updateChurch(id as string, req.body);
      return res
        .status(200)
        .json({ message: "Chapter updated successfully", data: church });
    } catch (error) {
      next(error);
    }
  },
  async deleteChurch(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await ChurchService.deleteChurch(id as string);
      return res
        .status(200)
        .json({ message: "Chapter deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteChurchesBulk(req: Request, res: Response, next: NextFunction) {
    const { ids } = req.body;
    try {
      await ChurchService.deleteChurches(ids);
      return res.status(200).json({
        message: "Chapters deleted successfully",
        data: { deletedCount: ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default ChurchController;
