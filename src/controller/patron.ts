import { getActor } from "@/helpers/request-actor";
import PatronService from "@/service/patron";
import { NextFunction, Request, Response } from "express";

const PatronController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const patron = await PatronService.create(req.body, getActor(req));
      return res
        .status(201)
        .json({ message: "Patron created successfully", data: patron });
    } catch (error) {
      next(error);
    }
  },
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const patrons = await PatronService.getAll();
      return res
        .status(200)
        .json({ message: "Patrons fetched successfully", data: patrons });
    } catch (error) {
      next(error);
    }
  },
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const patrons = await PatronService.getPublic();
      return res.status(200).json({
        message: "Public patrons fetched successfully",
        data: patrons,
      });
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const patron = await PatronService.update(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res
        .status(200)
        .json({ message: "Patron updated successfully", data: patron });
    } catch (error) {
      next(error);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PatronService.delete(req.params.id as string, getActor(req));
      return res
        .status(200)
        .json({ message: "Patron deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await PatronService.deleteMany(req.body.ids, getActor(req));
      return res.status(200).json({
        message: "Patrons deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default PatronController;
