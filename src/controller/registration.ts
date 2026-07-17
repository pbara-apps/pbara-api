import { getActor } from "@/helpers/request-actor";
import RegistrationService from "@/service/registration";
import { NextFunction, Request, Response } from "express";

const RegistrationController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await RegistrationService.create(req.body);
      return res.status(201).json({
        message: "Registration submitted successfully",
        data: registration,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { programId, category, status, page, limit } = req.query as {
        programId?: string;
        category?: string;
        status?: "pending" | "verified" | "rejected";
        page?: string;
        limit?: string;
      };

      const result = await RegistrationService.list({
        programId,
        category,
        status,
        page: Number(page) || 1,
        limit: Number(limit) || 20,
      });

      return res.status(200).json({
        message: "Registrations fetched successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await RegistrationService.getById(
        req.params.id as string,
      );
      return res.status(200).json({
        message: "Registration fetched successfully",
        data: registration,
      });
    } catch (error) {
      next(error);
    }
  },

  async getPendingCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await RegistrationService.getPendingCount();
      return res.status(200).json({
        message: "Pending registration count fetched successfully",
        data: { count },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await RegistrationService.updateStatus(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res.status(200).json({
        message: "Registration status updated successfully",
        data: registration,
      });
    } catch (error) {
      next(error);
    }
  },

  async addEntries(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await RegistrationService.addEntries(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res.status(200).json({
        message: "Participants added successfully",
        data: registration,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateEntry(req: Request, res: Response, next: NextFunction) {
    try {
      const registration = await RegistrationService.updateEntry(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res.status(200).json({
        message: "Participant updated successfully",
        data: registration,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default RegistrationController;
