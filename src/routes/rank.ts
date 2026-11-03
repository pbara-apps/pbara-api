import RankController from "@/controller/rank";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import {
  createRankBulkSchema,
  createRankSchema,
  reorderRanksSchema,
  updateRankSchema,
} from "@/schema/rank";
import express from "express";

const router = express.Router();

const canManageRanks = requireRole(["super_admin", "admin", "editor"]);

router.get("/public", RankController.getPublicRanks);

router.post("/create", [
  requireAuth,
  canManageRanks,
  validate(createRankSchema),
  RankController.createRank,
]);
router.post("/create/bulk", [
  requireAuth,
  canManageRanks,
  validate(createRankBulkSchema),
  RankController.createRankBulk,
]);
router.patch("/reorder", [
  requireAuth,
  canManageRanks,
  validate(reorderRanksSchema),
  RankController.reorderRanks,
]);
router.patch("/update/:id", [
  requireAuth,
  canManageRanks,
  validate(idParamSchema),
  validate(updateRankSchema),
  RankController.updateRank,
]);
// Must come before "/delete/:id", otherwise "bulk" is treated as an id.
router.delete("/delete/bulk", [
  requireAuth,
  canManageRanks,
  validate(bulkDeleteSchema),
  RankController.deleteRanksBulk,
]);
router.delete("/delete/:id", [
  requireAuth,
  canManageRanks,
  validate(idParamSchema),
  RankController.deleteRank,
]);
router.get("/:id", [
  requireAuth,
  validate(idParamSchema),
  RankController.getRankById,
]);
router.get("/", [requireAuth, RankController.getAllRanks]);

export default router;
