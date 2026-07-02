import GalleryController from "@/controller/gallery";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createGallerySchema, updateGallerySchema } from "@/schema/gallery";
import express from "express";

const router = express.Router();

router.get("/public", GalleryController.getPublic);
router.post("/create", [
  requireAuth,
  validate(createGallerySchema),
  GalleryController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  validate(updateGallerySchema),
  GalleryController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  validate(idParamSchema),
  GalleryController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  validate(bulkDeleteSchema),
  GalleryController.deleteBulk,
]);
router.get("/", [requireAuth, GalleryController.getAll]);

export default router;
