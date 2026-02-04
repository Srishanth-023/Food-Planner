/**
 * PostgreSQL Configuration
 * 
 * Handles connection to PostgreSQL for storing nutrition data,
 * glycemic index tables, and workout templates.
 */

const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'nutrivision_nutrition',
  process.env.POSTGRES_USER || 'postgres',
  process.env.POSTGRES_PASSWORD || '',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    
    // Connection pool settings
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    
    // Logging configuration
    logging: process.env.NODE_ENV === 'development' 
      ? (msg) => logger.debug(msg)
      : false,
    
    // Additional options
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    
    // Timezone
    timezone: '+00:00'
  }
);

/**
 * Connect to PostgreSQL database
 * @returns {Promise<void>}
 */
async function connectPostgres() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

/**
 * Synchronize all PostgreSQL models
 * @param {boolean} force - If true, drops existing tables
 * @returns {Promise<void>}
 */
async function syncPostgres(force = false) {
  try {
    await sequelize.sync({ force, alter: process.env.NODE_ENV === 'development' });
    logger.info('PostgreSQL models synchronized');
  } catch (error) {
    logger.error('Failed to sync PostgreSQL models:', error);
    throw error;
  }
}

/**
 * Close PostgreSQL connection
 * @returns {Promise<void>}
 */
async function closePostgres() {
  await sequelize.close();
  logger.info('PostgreSQL connection closed');
}

module.exports = {
  sequelize,
  connectPostgres,
  syncPostgres,
  closePostgres
};
