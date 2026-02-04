/**
 * JWT Authentication Middleware
 * 
 * Handles token validation, user authentication,
 * and role-based access control.
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/mongodb');
const logger = require('../utils/logger');

/**
 * Generate Access Token
 * @param {Object} user - User object
 * @returns {string} JWT access token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      email: user.email,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate Refresh Token
 * @param {Object} user - User object
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify Access Token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT refresh token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Authentication Middleware
 * Validates JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED'
        });
      }
      throw error;
    }

    // Check token type
    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type.'
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    
    if (decoded.type === 'access') {
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    }

    next();
  } catch (error) {
    // Token invalid, but that's okay for optional auth
    next();
  }
};

/**
 * Email Verification Required Middleware
 * Requires user to have verified email
 */
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

/**
 * Profile Completion Required Middleware
 * Requires user to have completed their profile
 */
const requireCompleteProfile = (req, res, next) => {
  const { physicalAttributes, profile } = req.user;
  
  const isComplete = 
    physicalAttributes.height &&
    physicalAttributes.weight &&
    physicalAttributes.age &&
    profile.gender;

  if (!isComplete) {
    return res.status(403).json({
      success: false,
      message: 'Please complete your profile before using this feature.',
      code: 'PROFILE_INCOMPLETE'
    });
  }
  next();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  authenticate,
  optionalAuth,
  requireEmailVerification,
  requireCompleteProfile
};
