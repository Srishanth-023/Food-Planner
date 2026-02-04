/**
 * NutriVision AI - Main Server Entry Point
 * 
 * This file initializes the Express server with all middleware,
 * database connections, and route configurations.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const { connectMongoDB } = require('./config/mongodb');
const { connectPostgres, syncPostgres } = require('./config/postgres');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const foodRoutes = require('./routes/food.routes');
const planRoutes = require('./routes/plan.routes');
const progressRoutes = require('./routes/progress.routes');
const nutritionRoutes = require('./routes/nutrition.routes');
const chatRoutes = require('./routes/chat.routes');

const app = express();

// ===========================================
// Security Middleware
// ===========================================

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit']
}));

// ===========================================
// Body Parsing & Compression
// ===========================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// ===========================================
// Logging
// ===========================================

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// ===========================================
// Static Files
// ===========================================

app.use('/uploads', express.static('uploads'));

// ===========================================
// Health Check Endpoint
// ===========================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NutriVision AI Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || 'v1'
  });
});

// ===========================================
// API Routes
// ===========================================

const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/food`, foodRoutes);
app.use(`${API_PREFIX}/plans`, planRoutes);
app.use(`${API_PREFIX}/progress`, progressRoutes);
app.use(`${API_PREFIX}/nutrition`, nutritionRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);

// ===========================================
// Error Handling
// ===========================================

app.use(notFoundHandler);
app.use(errorHandler);

// ===========================================
// Database Connections & Server Start
// ===========================================

const PORT = process.env.PORT || 5000;

/**
 * Initialize all database connections and start the server
 */
async function startServer() {
  try {
    // Connect to MongoDB
    await connectMongoDB();
    logger.info('✅ MongoDB connected successfully');

    // Connect to PostgreSQL
    await connectPostgres();
    logger.info('✅ PostgreSQL connected successfully');

    // Sync PostgreSQL models (create tables if not exist)
    if (process.env.NODE_ENV === 'development') {
      await syncPostgres();
      logger.info('✅ PostgreSQL models synchronized');
    }

    // Connect to Redis (optional, for caching)
    try {
      await connectRedis();
      logger.info('✅ Redis connected successfully');
    } catch (redisError) {
      logger.warn('⚠️ Redis connection failed, continuing without cache:', redisError.message);
    }

    // Start the server
    app.listen(PORT, () => {
      logger.info(`🚀 NutriVision AI Backend running on port ${PORT}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully');
  process.exit(0);
});

// Start the application
startServer();

module.exports = app;
