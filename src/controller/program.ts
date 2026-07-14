import { getActor } from "@/helpers/request-actor";
import RegistrationProgramService from "@/service/registration-program";
import { NextFunction, Request, Response } from "express";

const ProgramController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const program = await RegistrationProgramService.create(
        req.body,
        getActor(req),
      );
      return res
        .status(201)
        .json({ message: "Program created successfully", data: program });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("Program slug already exists") as Error & {
          status?: number;
        };
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const programs = await RegistrationProgramService.getAll();
      return res
        .status(200)
        .json({ message: "Programs fetched successfully", data: programs });
    } catch (error) {
      next(error);
    }
  },

  async getActive(req: Request, res: Response, next: NextFunction) {
    try {
      const programs = await RegistrationProgramService.getActive();
      return res.status(200).json({
        message: "Active programs fetched successfully",
        data: programs,
      });
    } catch (error) {
      next(error);
    }
  },

  async getActiveBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const program = await RegistrationProgramService.getActiveBySlug(
        req.params.slug as string,
      );
      return res
        .status(200)
        .json({ message: "Program fetched successfully", data: program });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const program = await RegistrationProgramService.update(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res
        .status(200)
        .json({ message: "Program updated successfully", data: program });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("Program slug already exists") as Error & {
          status?: number;
        };
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const program = await RegistrationProgramService.deactivate(
        req.params.id as string,
        getActor(req),
      );
      return res.status(200).json({
        message: "Program deactivated successfully",
        data: program,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default ProgramController;
