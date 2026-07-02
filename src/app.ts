import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import router from "./routes/index.js";
import connectDB from "./config/db_config.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    hasMongoUri: Boolean(process.env.MONGO_DB_URI),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
  });
});

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api", router);

app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API Error]", err);
  return res.status(err.status || 500).json({
    message:
      err.message ||
      "Something went wrong, if the problem persists, please contact the administrator",
    status: false,
  });
});

export default app;
