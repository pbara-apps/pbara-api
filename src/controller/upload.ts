import UploadService from "@/service/upload";
import { NextFunction, Request, Response } from "express";

const UploadController = {
  async uploadMedia(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "No file uploaded. Send the file under the 'file' field.",
          status: false,
        });
      }
      const folder =
        typeof req.body.folder === "string" && req.body.folder.trim()
          ? req.body.folder.trim()
          : "general";
      const safeFolder = /^[a-zA-Z0-9/_-]{1,50}$/.test(folder)
        ? folder
        : "general";

      const uploaded = await UploadService.uploadFile(req.file, safeFolder);

      return res.status(201).json({
        message: "File uploaded successfully",
        data: uploaded,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default UploadController;
