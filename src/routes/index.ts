import express, { Request, Response, NextFunction } from "express";
import churchRoutes from "./church";
import officeRoutes from "./office";
import executiveRoutes from "./executive";
import authRoutes from "./auth";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello World" });
});

router.use("/auth", authRoutes);
router.use("/church", churchRoutes);
router.use("/office", officeRoutes);
router.use("/executive", executiveRoutes);

router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.log("Error message: ", err.message);
  return res.status(err.status || 500).json({
    message:
      "Something went wrong, if the problem persists, please contact the administrator",
    status: false,
  });
});

export default router;
