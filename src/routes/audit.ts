import AuditController from "@/controller/audit";
import requireAuth from "@/middleware/requireAuth";
import express from "express";

const router = express.Router();

router.get("/", [requireAuth, AuditController.getLogs]);

export default router;
