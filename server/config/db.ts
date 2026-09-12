import mongoose from "mongoose";

// In-memory data store for fallback when MongoDB daemon is not running locally
// This ensures that during development/preview without a running mongod instance,
// the entire app still persists data in memory across sessions, conforming to Mongoose schemas.

let isConnectedToMongo = false;

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/support_chat";

  try {
    // Attempt Mongoose connection with a quick timeout so dev server doesn't stall
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    isConnectedToMongo = true;
    console.log(`[Database] Successfully connected to MongoDB at ${mongoUri}`);
  } catch (error: any) {
    isConnectedToMongo = false;
    console.warn(
      `[Database] Notice: Could not connect to external MongoDB (${error.message}). ` +
      `Activating embedded database store for persistent in-process data. ` +
      `To use external MongoDB, set MONGODB_URI in your environment.`
    );
  }
}

export function getIsMongoConnected() {
  return isConnectedToMongo;
}
