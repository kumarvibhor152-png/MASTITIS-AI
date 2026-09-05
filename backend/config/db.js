'use strict';

const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000;

let retryCount = 0;

/**
 * Establish a Mongoose connection with automatic retry logic.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌  MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  mongoose.connection.on('connected', () => {
    console.log('✅  MongoDB connected successfully.');
    retryCount = 0;
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌  MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️   MongoDB disconnected. Attempting to reconnect…');
    scheduleReconnect();
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄  MongoDB reconnected.');
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('🛑  MongoDB connection closed via app termination.');
    process.exit(0);
  });

  await attemptConnection(uri);
};

const attemptConnection = async (uri) => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  } catch (err) {
    console.error(`❌  MongoDB initial connection failed: ${err.message}`);
    scheduleReconnect(uri);
  }
};

const scheduleReconnect = (uri) => {
  if (retryCount >= MAX_RETRIES) {
    console.error(`❌  MongoDB max retries (${MAX_RETRIES}) reached. Exiting.`);
    process.exit(1);
  }
  retryCount += 1;
  const delay = RETRY_INTERVAL_MS * retryCount;
  console.log(`🔁  Retrying MongoDB connection in ${delay / 1000}s (attempt ${retryCount}/${MAX_RETRIES})…`);
  setTimeout(() => attemptConnection(uri || process.env.MONGO_URI), delay);
};

module.exports = connectDB;
