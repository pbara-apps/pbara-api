import AuditController from "@/controller/audit";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import express from "express";

const router = express.Router();

router.get("/", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  AuditController.getLogs,
]);

export default router;
