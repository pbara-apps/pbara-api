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
    cached.promise = mongoose.connect(DB_URI, { dbName: "pbara_db" });
  }

  cached.conn = await cached.promise;
  console.log("Connected to MongoDB");
  return cached.conn;
};

export default connectDB;
