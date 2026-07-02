import AuditService from "@/service/audit";
import { NextFunction, Request, Response } from "express";

const AuditController = {
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = Number(req.query.limit ?? 100);
      const logs = await AuditService.getLogs(limit);
      return res
        .status(200)
        .json({ message: "Audit logs fetched successfully", data: logs });
    } catch (error) {
      next(error);
    }
  },
};

export default AuditController;
