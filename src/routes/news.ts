import NewsController from "@/controller/news";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createNewsSchema, updateNewsSchema } from "@/schema/news";
import express from "express";

const router = express.Router();

router.get("/public", NewsController.getPublic);
router.get("/public/:idOrSlug", NewsController.getPublicByIdOrSlug);
router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createNewsSchema),
  NewsController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateNewsSchema),
  NewsController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  NewsController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  NewsController.deleteBulk,
]);
router.get("/", [requireAuth, NewsController.getAll]);

export default router;
