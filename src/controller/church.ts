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
};

export default ChurchController;
