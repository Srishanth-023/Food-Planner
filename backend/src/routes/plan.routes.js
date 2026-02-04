/**
 * Plan Generation Routes
 * 
 * Handles meal plan and workout plan generation
 * using AI and user preferences.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { WorkoutTemplate } = require('../models/postgres');
const { authenticate, requireCompleteProfile } = require('../middleware/auth.middleware');
const { 
  validate, 
  generateMealPlanSchema,
  generateWorkoutPlanSchema 
} = require('../middleware/validation');
const { setCache, getCache } = require('../config/redis');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route   POST /api/v1/plans/meal
 * @desc    Generate personalized meal plan
 * @access  Private
 */
router.post('/meal', authenticate, requireCompleteProfile, validate(generateMealPlanSchema), async (req, res, next) => {
  try {
    const { days, includeSnacks, preferences } = req.validatedBody;

    // Prepare user context for AI
    const userContext = {
      physicalAttributes: req.user.physicalAttributes,
      fitnessGoals: req.user.fitnessGoals,
      dietaryPreferences: {
        ...req.user.dietaryPreferences,
        ...preferences
      },
      calculatedMetrics: req.user.calculatedMetrics
    };

    // Call AI service for meal plan generation
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/v1/generate-meal-plan`,
      {
        user_context: userContext,
        days,
        include_snacks: includeSnacks
      },
      {
        timeout: parseInt(process.env.AI_SERVICE_TIMEOUT) || 60000
      }
    );

    const mealPlan = aiResponse.data.meal_plan;

    logger.info(`Meal plan generated for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        mealPlan,
        userMetrics: {
          dailyCalorieTarget: req.user.calculatedMetrics.dailyCalorieTarget,
          macroTargets: req.user.calculatedMetrics.macroTargets
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return next(new APIError('AI service unavailable', 503, 'AI_SERVICE_UNAVAILABLE'));
    }
    next(error);
  }
});

/**
 * @route   POST /api/v1/plans/workout
 * @desc    Generate personalized workout plan
 * @access  Private
 */
router.post('/workout', authenticate, requireCompleteProfile, validate(generateWorkoutPlanSchema), async (req, res, next) => {
  try {
    const { days, preferences } = req.validatedBody;

    // Determine difficulty based on activity level
    const difficultyMap = {
      sedentary: 'beginner',
      lightly_active: 'beginner',
      moderately_active: 'intermediate',
      very_active: 'advanced',
      extra_active: 'advanced'
    };

    const difficulty = preferences?.difficulty || 
      difficultyMap[req.user.fitnessGoals.activityLevel] || 'intermediate';

    // Try to get workout plan from templates first
    let workoutPlan = await WorkoutTemplate.generate7DayPlan(
      req.user.fitnessGoals.primaryGoal,
      difficulty
    );

    // If no templates available, use AI service
    if (!workoutPlan) {
      const userContext = {
        physicalAttributes: req.user.physicalAttributes,
        fitnessGoals: req.user.fitnessGoals,
        activityLevel: req.user.fitnessGoals.activityLevel
      };

      const aiResponse = await axios.post(
        `${AI_SERVICE_URL}/api/v1/generate-workout-plan`,
        {
          user_context: userContext,
          days,
          preferences: {
            difficulty,
            ...preferences
          }
        },
        {
          timeout: parseInt(process.env.AI_SERVICE_TIMEOUT) || 60000
        }
      );

      workoutPlan = aiResponse.data.workout_plan;
    }

    logger.info(`Workout plan generated for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        workoutPlan,
        userGoal: req.user.fitnessGoals.primaryGoal,
        difficulty,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return next(new APIError('AI service unavailable', 503, 'AI_SERVICE_UNAVAILABLE'));
    }
    next(error);
  }
});

/**
 * @route   GET /api/v1/plans/workout/templates
 * @desc    Get available workout templates
 * @access  Private
 */
router.get('/workout/templates', authenticate, async (req, res, next) => {
  try {
    const { goal, difficulty, workoutType } = req.query;

    const filters = {};
    if (difficulty) filters.difficulty = difficulty;
    if (workoutType) filters.workoutType = workoutType;

    const templates = await WorkoutTemplate.getByGoal(
      goal || req.user.fitnessGoals.primaryGoal,
      filters
    );

    res.json({
      success: true,
      data: { templates }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/plans/workout/templates/:id
 * @desc    Get specific workout template
 * @access  Private
 */
router.get('/workout/templates/:id', authenticate, async (req, res, next) => {
  try {
    const template = await WorkoutTemplate.findByPk(req.params.id);

    if (!template) {
      throw new APIError('Workout template not found', 404, 'TEMPLATE_NOT_FOUND');
    }

    // Increment usage count
    await WorkoutTemplate.incrementUsage(template.id);

    res.json({
      success: true,
      data: { template }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/plans/quick-meal
 * @desc    Get quick meal suggestions based on criteria
 * @access  Private
 */
router.post('/quick-meal', authenticate, async (req, res, next) => {
  try {
    const { mealType, maxCalories, dietType, excludeIngredients } = req.body;

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/v1/quick-meal-suggestion`,
      {
        meal_type: mealType,
        max_calories: maxCalories || req.user.calculatedMetrics.dailyCalorieTarget / 3,
        diet_type: dietType || req.user.dietaryPreferences.dietType,
        exclude_ingredients: excludeIngredients || req.user.dietaryPreferences.dislikedFoods,
        allergies: req.user.dietaryPreferences.allergies
      },
      {
        timeout: 30000
      }
    );

    res.json({
      success: true,
      data: {
        suggestions: aiResponse.data.suggestions
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return next(new APIError('AI service unavailable', 503, 'AI_SERVICE_UNAVAILABLE'));
    }
    next(error);
  }
});

module.exports = router;
