import express from "express";
import cors from "cors";
import router from "./routes/index.js";
import connectDB from "./config/db_config.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api", router);

export default app;
