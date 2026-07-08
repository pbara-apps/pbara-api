import UploadController from "@/controller/upload";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import upload from "@/middleware/upload";
import express from "express";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  upload.single("file"),
  UploadController.uploadMedia,
);

export default router;
