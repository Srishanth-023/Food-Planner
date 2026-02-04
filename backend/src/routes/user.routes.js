/**
 * User Routes
 * 
 * Handles user profile management, settings,
 * and physical attribute updates.
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models/mongodb');
const { authenticate, requireCompleteProfile } = require('../middleware/auth.middleware');
const { uploadProfilePicture } = require('../middleware/upload.middleware');
const { 
  validate,
  updateProfileSchema,
  updatePhysicalAttributesSchema,
  updateFitnessGoalsSchema,
  updateDietaryPreferencesSchema
} = require('../middleware/validation');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  res.json({
    success: true,
    data: {
      profile: req.user.profile,
      physicalAttributes: req.user.physicalAttributes,
      fitnessGoals: req.user.fitnessGoals,
      dietaryPreferences: req.user.dietaryPreferences,
      calculatedMetrics: req.user.calculatedMetrics
    }
  });
});

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const updates = req.validatedBody;

    // Update profile fields
    Object.keys(updates).forEach(key => {
      req.user.profile[key] = updates[key];
    });

    await req.user.save();

    logger.info(`Profile updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: req.user.profile
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/users/physical-attributes
 * @desc    Update physical attributes
 * @access  Private
 */
router.put('/physical-attributes', authenticate, validate(updatePhysicalAttributesSchema), async (req, res, next) => {
  try {
    const { height, weight, age } = req.validatedBody;

    req.user.physicalAttributes = {
      height,
      weight,
      age
    };

    // This will trigger recalculation of BMR, TDEE, etc.
    await req.user.save();

    logger.info(`Physical attributes updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Physical attributes updated successfully',
      data: {
        physicalAttributes: req.user.physicalAttributes,
        calculatedMetrics: req.user.calculatedMetrics
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/users/fitness-goals
 * @desc    Update fitness goals
 * @access  Private
 */
router.put('/fitness-goals', authenticate, validate(updateFitnessGoalsSchema), async (req, res, next) => {
  try {
    const { primaryGoal, targetWeight, weeklyGoal, activityLevel } = req.validatedBody;

    req.user.fitnessGoals = {
      primaryGoal,
      targetWeight,
      weeklyGoal,
      activityLevel
    };

    // This will trigger recalculation of TDEE and targets
    await req.user.save();

    logger.info(`Fitness goals updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Fitness goals updated successfully',
      data: {
        fitnessGoals: req.user.fitnessGoals,
        calculatedMetrics: req.user.calculatedMetrics
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/users/dietary-preferences
 * @desc    Update dietary preferences
 * @access  Private
 */
router.put('/dietary-preferences', authenticate, validate(updateDietaryPreferencesSchema), async (req, res, next) => {
  try {
    const updates = req.validatedBody;

    req.user.dietaryPreferences = {
      ...req.user.dietaryPreferences,
      ...updates
    };

    await req.user.save();

    logger.info(`Dietary preferences updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Dietary preferences updated successfully',
      data: {
        dietaryPreferences: req.user.dietaryPreferences
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/users/avatar
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/avatar', authenticate, uploadProfilePicture, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const avatarUrl = `/uploads/profile-pictures/${req.file.filename}`;
    req.user.profile.avatar = avatarUrl;
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile picture updated',
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/users/calculated-metrics
 * @desc    Get calculated metrics (BMR, TDEE, targets)
 * @access  Private
 */
router.get('/calculated-metrics', authenticate, requireCompleteProfile, async (req, res) => {
  // Recalculate to ensure latest values
  req.user.calculateMetrics();

  res.json({
    success: true,
    data: {
      bmr: req.user.calculatedMetrics.bmr,
      tdee: req.user.calculatedMetrics.tdee,
      dailyCalorieTarget: req.user.calculatedMetrics.dailyCalorieTarget,
      macroTargets: req.user.calculatedMetrics.macroTargets,
      physicalAttributes: req.user.physicalAttributes,
      fitnessGoals: req.user.fitnessGoals
    }
  });
});

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/account', authenticate, async (req, res, next) => {
  try {
    req.user.isActive = false;
    req.user.refreshTokens = [];
    await req.user.save();

    logger.info(`Account deactivated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
