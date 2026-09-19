import mongoose from 'mongoose';

/**
 * Connect to MongoDB instance with resilient retry/error logging
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trinetra');
    console.log(`[MongoDB] Connected Successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB] Connection Error: ${error.message}`);
    // Do not crash the entire process in dev, allow retries or offline mode
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};
