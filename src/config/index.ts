import express from "express";
import cors from "cors";
import router from "../routes/index.js";
import connectDB from "./db_config.js";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api", router);

const startServer = () => {
  //===== Connect to MongoDB======
  connectDB();
  //===============================================
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

export default startServer;
