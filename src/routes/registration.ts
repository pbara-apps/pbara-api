import RegistrationController from "@/controller/registration";
import UploadController from "@/controller/upload";
import requireAuth from "@/middleware/requireAuth";
import requireRole from "@/middleware/requireRole";
import { uploadImage } from "@/middleware/upload";
import validate from "@/middleware/validate";
import { idParamSchema } from "@/schema/common";
import {
  createRegistrationSchema,
  listRegistrationsQuerySchema,
  updateRegistrationStatusSchema,
} from "@/schema/registration";
import express from "express";

const router = express.Router();

router.post(
  "/upload-proof",
  uploadImage.single("file"),
  UploadController.uploadRegistrationProof,
);

router.post("/create", [
  validate(createRegistrationSchema),
  RegistrationController.create,
]);

router.patch("/status/:id", [
  requireAuth,
  requireRole(["super_admin", "admin", "editor"]),
  validate(updateRegistrationStatusSchema),
  RegistrationController.updateStatus,
]);

router.get("/:id", [
  requireAuth,
  validate(idParamSchema),
  RegistrationController.getById,
]);

router.get("/", [
  requireAuth,
  validate(listRegistrationsQuerySchema),
  RegistrationController.getAll,
]);

export default router;
