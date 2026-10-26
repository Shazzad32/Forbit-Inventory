import mongoose from "mongoose";

// One shared connection per server process (survives hot reload in dev).
const cache = (globalThis._invMongoose ??= { conn: null, promise: null });

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set (see .env.example)");
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || "serviceDB",
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null; // allow a retry on the next request
    throw err;
  }
  return cache.conn;
}
