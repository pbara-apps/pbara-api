import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const DB_URI = process.env.MONGO_DB_URI;
  if (!DB_URI) {
    throw new Error("MONGO_DB_URI is not set");
  }

  if (!cached.promise) {
    const DB_NAME = process.env.DB_NAME;
    if (!DB_NAME) {
      throw new Error("DB_NAME is not set");
    }
    cached.promise = mongoose
      .connect(DB_URI, {
        dbName: DB_NAME,
        serverSelectionTimeoutMS: 10000,
      })
      .then((conn) => {
        console.log("Connected to MongoDB");
        cached.conn = conn;
        return conn;
      })
      .catch((error) => {
        cached.promise = null;
        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  return await cached.promise;
};

export default connectDB;
