import mongoose from "mongoose";

const connectDB = async () => {
  const DB_URI = process.env.MONGO_DB_URI;
  if (!DB_URI) throw new Error("MONGO_DB_URI is not set");
  await mongoose.connect(DB_URI, { dbName: "pbara_db" });
  console.log("Connected to MongoDB");
};

export default connectDB;
