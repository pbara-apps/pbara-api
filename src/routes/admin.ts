import AdminController from "@/controller/admin";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { updateDirectorDeskSchema } from "@/schema/director-desk";
import { updateHeroStatsSchema } from "@/schema/hero-stats";
import express from "express";

const router = express.Router();

router.get("/dashboard", [requireAuth, AdminController.getDashboard]);

router.get("/director-desk/public", [AdminController.getDirectorDesk]);
router.get("/hero-stats/public", [AdminController.getHeroStats]);

router.get("/director-desk", [requireAuth, AdminController.getDirectorDesk]);
router.patch("/director-desk", [
  requireAuth,
  requireRole(["super_admin", "admin"]),
  validate(updateDirectorDeskSchema),
  AdminController.updateDirectorDesk,
]);
router.get("/hero-stats", [requireAuth, AdminController.getHeroStats]);
router.patch("/hero-stats", [
  requireAuth,
  requireRole(["super_admin", "admin"]),
  validate(updateHeroStatsSchema),
  AdminController.updateHeroStats,
]);

export default router;
