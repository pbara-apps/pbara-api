import { getActor } from "@/helpers/request-actor";
import NewsService from "@/service/news";
import { NextFunction, Request, Response } from "express";

const NewsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await NewsService.create(req.body, getActor(req));
      return res
        .status(201)
        .json({ message: "News article created successfully", data: news });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("Slug already exists") as Error & {
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
      const news = await NewsService.getAll();
      return res
        .status(200)
        .json({ message: "News fetched successfully", data: news });
    } catch (error) {
      next(error);
    }
  },
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await NewsService.getPublic();
      return res
        .status(200)
        .json({ message: "Public news fetched successfully", data: news });
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await NewsService.update(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res
        .status(200)
        .json({ message: "News article updated successfully", data: news });
    } catch (error) {
      next(error);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await NewsService.delete(req.params.id as string, getActor(req));
      return res
        .status(200)
        .json({ message: "News article deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteBulk(req: Request, res: Response, next: NextFunction) {
    try {
      await NewsService.deleteMany(req.body.ids, getActor(req));
      return res.status(200).json({
        message: "News articles deleted successfully",
        data: { deletedCount: req.body.ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default NewsController;
