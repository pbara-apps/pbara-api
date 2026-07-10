import RankController from "@/controller/rank";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import {
  createRankBulkSchema,
  createRankSchema,
  updateRankSchema,
} from "@/schema/rank";
import express from "express";

const router = express.Router();

router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createRankSchema),
  RankController.createRank,
]);
router.post("/create/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createRankBulkSchema),
  RankController.createRankBulk,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  validate(updateRankSchema),
  RankController.updateRank,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  RankController.deleteRank,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  RankController.deleteRanksBulk,
]);
router.get("/:id", [
  requireAuth,
  validate(idParamSchema),
  RankController.getRankById,
]);
router.get("/", [requireAuth, RankController.getAllRanks]);

export default router;
