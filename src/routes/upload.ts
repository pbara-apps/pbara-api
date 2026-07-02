import UploadController from "@/controller/upload";
import requireAuth from "@/middleware/requireAuth";
import upload from "@/middleware/upload";
import express from "express";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  upload.single("file"),
  UploadController.uploadMedia,
);

export default router;
