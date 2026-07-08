import GalleryController from "@/controller/gallery";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import {
  createBulkGallerySchema,
  createGallerySchema,
  updateGallerySchema,
} from "@/schema/gallery";
import express from "express";

const router = express.Router();

router.get("/public", GalleryController.getPublic);
router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createGallerySchema),
  GalleryController.create,
]);
router.post("/create/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createBulkGallerySchema),
  GalleryController.createBulk,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateGallerySchema),
  GalleryController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  GalleryController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  GalleryController.deleteBulk,
]);
router.get("/", [requireAuth, GalleryController.getAll]);

export default router;
