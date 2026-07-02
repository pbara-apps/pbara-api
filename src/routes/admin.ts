import AdminController from "@/controller/admin";
import requireAuth from "@/middleware/requireAuth";
import express from "express";

const router = express.Router();

router.get("/dashboard", [requireAuth, AdminController.getDashboard]);

router.get("/director-desk", [requireAuth, AdminController.getDirectorDesk]);

export default router;
