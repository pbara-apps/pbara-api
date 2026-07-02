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

      const uploaded = await UploadService.uploadFile(req.file, folder);

      return res.status(201).json({
        message: "File uploaded successfully",
        data: uploaded,
      });
    } catch (error) {
      console.log(error);
      next(error);
    }
  },
};

export default UploadController;
