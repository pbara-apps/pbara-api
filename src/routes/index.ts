import express, { Request, Response, NextFunction } from "express";
import settingsRoutes from "./settings";
import messageRoutes from "./message";
import uploadRoutes from "./upload";
import auditRoutes from "./audit";
import churchRoutes from "./church";
import eventRoutes from "./event";
import executiveRoutes from "./executive";
import galleryRoutes from "./gallery";
import newsRoutes from "./news";
import officeRoutes from "./office";
import authRoutes from "./auth";
import adminRoutes from "./admin";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello World" });
});

router.use("/auth", authRoutes);
router.use("/church", churchRoutes);
router.use("/office", officeRoutes);
router.use("/executive", executiveRoutes);
router.use("/news", newsRoutes);
router.use("/event", eventRoutes);
router.use("/gallery", galleryRoutes);
router.use("/admin", adminRoutes);
router.use("/audit", auditRoutes);
router.use("/upload", uploadRoutes);
router.use("/message", messageRoutes);
router.use("/settings", settingsRoutes);

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  return res.status(err.status || 500).json({
    message:
      err.message ||
      "Something went wrong, if the problem persists, please contact the administrator",
    status: false,
  });
});

export default router;
