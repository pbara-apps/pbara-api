import OfficeService from "@/service/offices";
import { NextFunction, Request, Response } from "express";

const OfficeController = {
  async createOffice(req: Request, res: Response, next: NextFunction) {
    const officeBody = req.body;
    try {
      const office = await OfficeService.createOffice(officeBody);
      return res
        .status(201)
        .json({ message: "Office created successfully", data: office });
    } catch (error) {
      if ((error as any).code === 11000) {
        const dupError: any = new Error("Office already exists");
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },
  async createOfficeBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const officeBody = req.body;
      const offices = await OfficeService.createOfficeBulk(officeBody);
      return res
        .status(201)
        .json({ message: "Offices created successfully", data: offices });
    } catch (error) {
      next(error);
    }
  },
  async getAllOffice(req: Request, res: Response, next: NextFunction) {
    try {
      const offices = await OfficeService.getAllOffice();
      return res
        .status(200)
        .json({ message: "Offices fetched successfully", data: offices });
    } catch (error) {
      next(error);
    }
  },
  async updateOffice(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      const office = await OfficeService.updateOffice(id as string, req.body);
      return res
        .status(200)
        .json({ message: "Office updated successfully", data: office });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("Office already exists") as Error & {
          status?: number;
        };
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },
  async deleteOffice(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    try {
      await OfficeService.deleteOffice(id as string);
      return res
        .status(200)
        .json({ message: "Office deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteOfficesBulk(req: Request, res: Response, next: NextFunction) {
    const { ids } = req.body;
    try {
      await OfficeService.deleteOffices(ids);
      return res.status(200).json({
        message: "Offices deleted successfully",
        data: { deletedCount: ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default OfficeController;
