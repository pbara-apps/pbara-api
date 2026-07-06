import { getActor } from "@/helpers/request-actor";
import GalleryService from "@/service/gallery";
import { NextFunction, Request, Response } from "express";

const GalleryController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await GalleryService.create(req.body, getActor(req));
      return res
        .status(201)
        .json({ message: "Gallery item created successfully", data: item });
    } catch (error) {
      next(error);
    }
  },
  async createBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await GalleryService.createBulk(req.body, getActor(req));
      return res.status(201).json({
        message: `${items.length} gallery items created successfully`,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  },
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const items = await GalleryService.getAll();
      return res
        .status(200)
        .json({ message: "Gallery fetched successfully", data: items });
    } catch (error) {
      next(error);
    }
  },
  async getPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const type = req.query.type as "photo" | "video" | undefined;
      const items = await GalleryService.getPublic(type);
      return res
        .status(200)
        .json({ message: "Public gallery fetched successfully", data: items });
    } catch (error) {
      next(error);
    }
  },
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await GalleryService.update(
        req.params.id as string,
        req.body,
        getActor(req),
      );
      return res
        .status(200)
        .json({ message: "Gallery item updated successfully", data: item });
    } catch (error) {
      next(error);
    }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await GalleryService.delete(req.params.id as string, getActor(req));
      return res
        .status(200)
        .json({ message: "Gallery item deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteBulk(req: Request, res: Response, next: NextFunction) {
    try {
      await GalleryService.deleteMany(req.body.ids, getActor(req));
      return res.status(200).json({
        message: "Gallery items deleted successfully",
        data: { deletedCount: req.body.ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default GalleryController;
