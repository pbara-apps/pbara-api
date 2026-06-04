import AuthController from "@/controller/auth";
import validate from "@/middleware/validate";
import { loginSchema } from "@/schema/auth";
import express from "express";
const router = express.Router();

router.post("/login", [validate(loginSchema), AuthController.login]);

export default router;
