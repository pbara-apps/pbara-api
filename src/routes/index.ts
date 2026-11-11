import express, { Request, Response, NextFunction } from "express";
import settingsRoutes from "./settings";
import accountRoutes from "./account";
import messageRoutes from "./message";
import uploadRoutes from "./upload";
import auditRoutes from "./audit";
import churchRoutes from "./church";
import eventRoutes from "./event";
import executiveRoutes from "./executive";
import galleryRoutes from "./gallery";
import newsRoutes from "./news";
import officeRoutes from "./office";
import patronRoutes from "./patron";
import programRoutes from "./program";
import rankRoutes from "./rank";
import registrationRoutes from "./registration";
import authRoutes from "./auth";
import adminRoutes from "./admin";
import subscriberRoutes from "./subscriber";
import chapterPortalRoutes from "./chapter-portal";
import chapterAdminRoutes from "./chapter-admin";
import notificationRoutes from "./notification";
import financeRoutes from "./finance";
import engagementRoutes from "./engagement";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/accounts", accountRoutes);
router.use("/church", churchRoutes);
router.use("/office", officeRoutes);
router.use("/rank", rankRoutes);
router.use("/executive", executiveRoutes);
router.use("/patron", patronRoutes);
router.use("/news", newsRoutes);
router.use("/event", eventRoutes);
router.use("/gallery", galleryRoutes);
router.use("/program", programRoutes);
router.use("/registration", registrationRoutes);
router.use("/admin", adminRoutes);
router.use("/audit", auditRoutes);
router.use("/upload", uploadRoutes);
router.use("/message", messageRoutes);
router.use("/settings", settingsRoutes);
router.use("/subscriber", subscriberRoutes);
router.use("/chapter-portal", chapterPortalRoutes);
router.use("/chapter-admin", chapterAdminRoutes);
router.use("/notifications", notificationRoutes);
router.use("/finance", financeRoutes);
router.use("/engagement", engagementRoutes);

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  process.env.NODE_ENV !== "production" && console.error("[API Error]", err);
  const safeMessage =
    err?.status && err.status < 500
      ? err.message
      : "Something went wrong, if the problem persists, please contact the administrator";
  return res.status(err.status || 500).json({
    message: safeMessage,
    status: false,
  });
});

export default router;
