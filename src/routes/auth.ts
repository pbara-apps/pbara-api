import AuthController from "@/controller/auth";
import requireAuth from "@/middleware/requireAuth";
import validate from "@/middleware/validate";
import { loginSchema } from "@/schema/auth";
import express from "express";
const router = express.Router();

router.post("/login", [validate(loginSchema), AuthController.login]);
router.get("/me", [requireAuth, AuthController.profile]);

export default router;
