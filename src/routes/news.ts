import NewsController from "@/controller/news";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createNewsSchema, updateNewsSchema } from "@/schema/news";
import express from "express";

const router = express.Router();

router.get("/public", NewsController.getPublic);
router.get("/public/:idOrSlug", NewsController.getPublicByIdOrSlug);
router.post("/create", [
  requireAuth,
  validate(createNewsSchema),
  NewsController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  validate(updateNewsSchema),
  NewsController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  validate(idParamSchema),
  NewsController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  validate(bulkDeleteSchema),
  NewsController.deleteBulk,
]);
router.get("/", [requireAuth, NewsController.getAll]);

export default router;
