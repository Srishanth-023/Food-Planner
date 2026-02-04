/**
 * Redis Configuration
 * 
 * Handles connection to Redis for session caching,
 * rate limiting storage, and temporary data.
 */

const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

/**
 * Connect to Redis
 * @returns {Promise<RedisClient>}
 */
async function connectRedis() {
  const redisUrl = process.env.REDIS_URL || 
    `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

  redisClient = createClient({
    url: redisUrl,
    password: process.env.REDIS_PASSWORD || undefined,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis error:', err);
  });

  redisClient.on('end', () => {
    logger.info('Redis connection ended');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Get Redis client instance
 * @returns {RedisClient|null}
 */
function getRedisClient() {
  return redisClient;
}

/**
 * Set a value in Redis with optional expiration
 * @param {string} key - The key to set
 * @param {string} value - The value to store
 * @param {number} expirationSeconds - Optional expiration time in seconds
 * @returns {Promise<void>}
 */
async function setCache(key, value, expirationSeconds = null) {
  if (!redisClient) return;
  
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
  
  if (expirationSeconds) {
    await redisClient.setEx(key, expirationSeconds, stringValue);
  } else {
    await redisClient.set(key, stringValue);
  }
}

/**
 * Get a value from Redis
 * @param {string} key - The key to retrieve
 * @returns {Promise<string|object|null>}
 */
async function getCache(key) {
  if (!redisClient) return null;
  
  const value = await redisClient.get(key);
  
  if (!value) return null;
  
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * Delete a key from Redis
 * @param {string} key - The key to delete
 * @returns {Promise<void>}
 */
async function deleteCache(key) {
  if (!redisClient) return;
  await redisClient.del(key);
}

/**
 * Clear all cached data matching a pattern
 * @param {string} pattern - The pattern to match keys
 * @returns {Promise<void>}
 */
async function clearCachePattern(pattern) {
  if (!redisClient) return;
  
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
}

/**
 * Close Redis connection
 * @returns {Promise<void>}
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  connectRedis,
  getRedisClient,
  setCache,
  getCache,
  deleteCache,
  clearCachePattern,
  closeRedis
};
