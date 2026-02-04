/**
 * Authentication Routes
 * 
 * Handles user registration, login, token refresh,
 * password reset, and email verification.
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models/mongodb');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  authenticate 
} = require('../middleware/auth.middleware');
const { 
  validate, 
  registerSchema, 
  loginSchema,
  refreshTokenSchema 
} = require('../middleware/validation');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.validatedBody;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new APIError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    // Create new user
    const user = new User({
      email,
      password,
      profile: {
        firstName,
        lastName
      }
    });

    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to user
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    // Find user with password field
    const user = await User.findByCredentials(email, password);

    if (!user) {
      throw new APIError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new APIError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token and update last login
    user.refreshTokens.push({ token: refreshToken });
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          profile: user.profile,
          physicalAttributes: user.physicalAttributes,
          fitnessGoals: user.fitnessGoals,
          dietaryPreferences: user.dietaryPreferences,
          calculatedMetrics: user.calculatedMetrics
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedBody;

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new APIError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new APIError('User not found', 401, 'USER_NOT_FOUND');
    }

    const tokenExists = user.refreshTokens.some(t => t.token === refreshToken);
    if (!tokenExists) {
      throw new APIError('Refresh token not found', 401, 'REFRESH_TOKEN_NOT_FOUND');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    // Optionally rotate refresh token for better security
    const newRefreshToken = generateRefreshToken(user);
    
    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(t => t.token !== refreshToken);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      success: true,
      message: 'Token refreshed',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate refresh token)
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Remove specific refresh token
      req.user.refreshTokens = req.user.refreshTokens.filter(
        t => t.token !== refreshToken
      );
    } else {
      // Remove all refresh tokens (logout from all devices)
      req.user.refreshTokens = [];
    }

    await req.user.save();

    logger.info(`User logged out: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        profile: req.user.profile,
        physicalAttributes: req.user.physicalAttributes,
        fitnessGoals: req.user.fitnessGoals,
        dietaryPreferences: req.user.dietaryPreferences,
        calculatedMetrics: req.user.calculatedMetrics,
        isEmailVerified: req.user.isEmailVerified,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt
      }
    }
  });
});

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.userId).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new APIError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    // Update password
    user.password = newPassword;
    
    // Invalidate all refresh tokens (force re-login on all devices)
    user.refreshTokens = [];
    
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
