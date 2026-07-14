import RankService from "@/service/rank";
import { NextFunction, Request, Response } from "express";

const RankController = {
  async createRank(req: Request, res: Response, next: NextFunction) {
    try {
      const rank = await RankService.createRank(req.body);
      return res
        .status(201)
        .json({ message: "Rank created successfully", data: rank });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("Rank already exists") as Error & {
          status?: number;
        };
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },
  async createRankBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const ranks = await RankService.createRankBulk(req.body);
      return res
        .status(201)
        .json({ message: "Ranks created successfully", data: ranks });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("One or more ranks already exist") as Error & {
          status?: number;
        };
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },
  async getAllRanks(req: Request, res: Response, next: NextFunction) {
    try {
      const ranks = await RankService.getAllRanks();
      return res
        .status(200)
        .json({ message: "Ranks fetched successfully", data: ranks });
    } catch (error) {
      next(error);
    }
  },
  async getPublicRanks(req: Request, res: Response, next: NextFunction) {
    try {
      const ranks = await RankService.getPublicRanks();
      return res.status(200).json({
        message: "Public ranks fetched successfully",
        data: ranks,
      });
    } catch (error) {
      next(error);
    }
  },
  async getRankById(req: Request, res: Response, next: NextFunction) {
    try {
      const rank = await RankService.getRankById(req.params.id as string);
      if (!rank) {
        const err = new Error("Rank not found") as Error & { status?: number };
        err.status = 404;
        return next(err);
      }
      return res
        .status(200)
        .json({ message: "Rank fetched successfully", data: rank });
    } catch (error) {
      next(error);
    }
  },
  async updateRank(req: Request, res: Response, next: NextFunction) {
    try {
      const rank = await RankService.updateRank(
        req.params.id as string,
        req.body,
      );
      return res
        .status(200)
        .json({ message: "Rank updated successfully", data: rank });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const dupError = new Error("Rank already exists") as Error & {
          status?: number;
        };
        dupError.status = 400;
        return next(dupError);
      }
      next(error);
    }
  },
  async deleteRank(req: Request, res: Response, next: NextFunction) {
    try {
      await RankService.deleteRank(req.params.id as string);
      return res
        .status(200)
        .json({ message: "Rank deleted successfully", data: null });
    } catch (error) {
      next(error);
    }
  },
  async deleteRanksBulk(req: Request, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      await RankService.deleteRanks(ids);
      return res.status(200).json({
        message: "Ranks deleted successfully",
        data: { deletedCount: ids.length },
      });
    } catch (error) {
      next(error);
    }
  },
};

export default RankController;
