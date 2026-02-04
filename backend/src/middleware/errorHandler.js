/**
 * Error Handler Middleware
 * 
 * Centralized error handling for the application.
 * Formats errors consistently and logs them appropriately.
 */

const logger = require('../utils/logger');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body,
    userId: req.userId || 'anonymous'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new APIError(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = new APIError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = messages.join('. ');
    error = new APIError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new APIError('Invalid token', 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    error = new APIError('Token expired', 401, 'TOKEN_EXPIRED');
  }

  // Sequelize errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(e => e.message);
    const message = messages.join('. ');
    error = new APIError(message, 400, 'VALIDATION_ERROR');
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    const message = `${field} already exists`;
    error = new APIError(message, 400, 'DUPLICATE_FIELD');
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds the maximum allowed size';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field';
    }
    error = new APIError(message, 400, err.code);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    code: error.code || 'SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      error: err
    })
  });
};

module.exports = errorHandler;
module.exports.APIError = APIError;
