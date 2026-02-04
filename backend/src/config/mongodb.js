/**
 * MongoDB Configuration
 * 
 * Handles connection to MongoDB for storing user data,
 * food logs, weight logs, and chat history.
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 * @returns {Promise<void>}
 */
async function connectMongoDB() {
  const mongoUri = process.env.NODE_ENV === 'production'
    ? process.env.MONGODB_URI_PROD
    : process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MongoDB URI is not defined in environment variables');
  }

  const options = {
    // Connection pool settings
    maxPoolSize: 10,
    minPoolSize: 5,
    
    // Timeout settings
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    
    // Keep alive
    heartbeatFrequencyMS: 10000,
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
  };

  try {
    await mongoose.connect(mongoUri, options);
    
    // Connection event handlers
    mongoose.connection.on('connected', () => {
      logger.info('MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Get MongoDB connection status
 * @returns {string} Connection state
 */
function getConnectionStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState];
}

/**
 * Close MongoDB connection
 * @returns {Promise<void>}
 */
async function closeMongoDB() {
  await mongoose.connection.close();
}

module.exports = {
  connectMongoDB,
  getConnectionStatus,
  closeMongoDB
};
