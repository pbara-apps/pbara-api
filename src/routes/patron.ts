import PatronController from "@/controller/patron";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import validate from "@/middleware/validate";
import { bulkDeleteSchema, idParamSchema } from "@/schema/common";
import { createPatronSchema, updatePatronSchema } from "@/schema/patron";
import express from "express";

const router = express.Router();

router.get("/public", PatronController.getPublic);

router.post("/create", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(createPatronSchema),
  PatronController.create,
]);
router.patch("/update/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updatePatronSchema),
  PatronController.update,
]);
router.delete("/delete/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(idParamSchema),
  PatronController.delete,
]);
router.delete("/delete/bulk", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(bulkDeleteSchema),
  PatronController.deleteBulk,
]);
router.get("/", [requireAuth, PatronController.getAll]);

export default router;
