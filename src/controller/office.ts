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
};

export default OfficeController;
