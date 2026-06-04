import ChurchController from "@/controller/church";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { createBulkChurchSchema, createChurchSchema } from "@/schema/church";
import express from "express";
const router = express.Router();

router.post("/create", [
  requireAuth,
  validate(createChurchSchema),
  ChurchController.createChurch,
]);
router.post("/create/bulk", [
  requireAuth,
  validate(createBulkChurchSchema),
  ChurchController.createBulkChurch,
]);
router.get("/", [requireAuth, ChurchController.getAllChurch]);

export default router;
