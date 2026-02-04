/**
 * Food Routes
 * 
 * Handles food image analysis, food logging,
 * and food search functionality.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { FoodLog } = require('../models/mongodb');
const { NutritionData, GlycemicIndex } = require('../models/postgres');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadFoodImageToMemory } = require('../middleware/upload.middleware');
const { validate, createFoodLogSchema } = require('../middleware/validation');
const { setCache, getCache } = require('../config/redis');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route   POST /api/v1/food/analyze
 * @desc    Analyze food image using AI
 * @access  Private
 */
router.post('/analyze', authenticate, uploadFoodImageToMemory, async (req, res, next) => {
  try {
    if (!req.file) {
      throw new APIError('No image file provided', 400, 'NO_IMAGE');
    }

    // Send image to AI service for analysis
    const formData = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    formData.append('image', blob, req.file.originalname);

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/v1/analyze-image`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: parseInt(process.env.AI_SERVICE_TIMEOUT) || 60000
      }
    );

    const { detected_foods, portion_estimates } = aiResponse.data;

    // Enrich with nutrition data from database
    const enrichedFoods = await Promise.all(
      detected_foods.map(async (food) => {
        // Look up nutrition data
        const nutritionData = await NutritionData.findByExactName(food.name);
        
        // Look up GI data
        const giData = await GlycemicIndex.findByFoodName(food.name);

        const portionGrams = portion_estimates[food.name] || 100;

        let nutrition = {
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          fiber: 0
        };

        if (nutritionData) {
          nutrition = nutritionData.calculateForPortion(portionGrams);
        }

        // Calculate Glycemic Load
        let glycemicLoad = null;
        let glCategory = 'unknown';
        if (giData && nutrition.carbohydrates) {
          const netCarbs = nutrition.carbohydrates - (nutrition.fiber || 0);
          glycemicLoad = (giData.giValue * netCarbs) / 100;
          
          if (glycemicLoad < 10) glCategory = 'low';
          else if (glycemicLoad < 20) glCategory = 'medium';
          else glCategory = 'high';
        }

        return {
          foodName: food.name,
          confidence: food.confidence,
          boundingBox: food.bounding_box,
          portion: {
            amount: portionGrams,
            unit: 'g'
          },
          nutrition,
          glycemicIndex: giData ? {
            value: giData.giValue,
            category: giData.giCategory
          } : { value: null, category: 'unknown' },
          glycemicLoad: {
            value: glycemicLoad ? Math.round(glycemicLoad * 10) / 10 : null,
            category: glCategory
          }
        };
      })
    );

    // Calculate totals
    const totals = enrichedFoods.reduce((acc, food) => {
      acc.calories += food.nutrition.calories;
      acc.protein += food.nutrition.protein;
      acc.carbohydrates += food.nutrition.carbohydrates;
      acc.fat += food.nutrition.fat;
      acc.fiber += food.nutrition.fiber;
      return acc;
    }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 });

    logger.info(`Food analysis completed for user: ${req.user.email}, detected ${enrichedFoods.length} foods`);

    res.json({
      success: true,
      data: {
        foods: enrichedFoods,
        totals,
        analysisTimestamp: new Date().toISOString()
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
 * @route   POST /api/v1/food/log
 * @desc    Create a food log entry
 * @access  Private
 */
router.post('/log', authenticate, validate(createFoodLogSchema), async (req, res, next) => {
  try {
    const logData = {
      userId: req.userId,
      ...req.validatedBody
    };

    // Enrich foods with GI/GL data
    for (const food of logData.foods) {
      const giData = await GlycemicIndex.findByFoodName(food.foodName);
      
      if (giData) {
        food.glycemicIndex = {
          value: giData.giValue,
          category: giData.giCategory
        };

        // Calculate GL
        const netCarbs = food.nutrition.carbohydrates - (food.nutrition.fiber || 0);
        const gl = (giData.giValue * netCarbs) / 100;
        
        food.glycemicLoad = {
          value: Math.round(gl * 10) / 10,
          category: gl < 10 ? 'low' : gl < 20 ? 'medium' : 'high'
        };
      }
    }

    const foodLog = new FoodLog(logData);
    await foodLog.save();

    logger.info(`Food log created for user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Food log created successfully',
      data: {
        foodLog
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/food/logs
 * @desc    Get food logs for a date range
 * @access  Private
 */
router.get('/logs', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate, mealType } = req.query;
    
    const query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (mealType) {
      query.mealType = mealType;
    }

    const logs = await FoodLog.find(query)
      .sort({ date: -1, mealTime: -1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/food/logs/daily/:date
 * @desc    Get daily food summary
 * @access  Private
 */
router.get('/logs/daily/:date', authenticate, async (req, res, next) => {
  try {
    const date = new Date(req.params.date);
    const summary = await FoodLog.getDailySummary(req.userId, date);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/food/logs/weekly
 * @desc    Get weekly food statistics
 * @access  Private
 */
router.get('/logs/weekly', authenticate, async (req, res, next) => {
  try {
    const { startDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    
    // Set to beginning of week (Monday)
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const stats = await FoodLog.getWeeklyStats(req.userId, start);

    res.json({
      success: true,
      data: {
        weekStartDate: start,
        dailyStats: stats
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/food/logs/:id
 * @desc    Get specific food log
 * @access  Private
 */
router.get('/logs/:id', authenticate, async (req, res, next) => {
  try {
    const log = await FoodLog.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!log) {
      throw new APIError('Food log not found', 404, 'LOG_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { log }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/food/logs/:id
 * @desc    Update food log
 * @access  Private
 */
router.put('/logs/:id', authenticate, async (req, res, next) => {
  try {
    const log = await FoodLog.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!log) {
      throw new APIError('Food log not found', 404, 'LOG_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Food log updated',
      data: { log }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/food/logs/:id
 * @desc    Delete food log
 * @access  Private
 */
router.delete('/logs/:id', authenticate, async (req, res, next) => {
  try {
    const log = await FoodLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!log) {
      throw new APIError('Food log not found', 404, 'LOG_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Food log deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/food/search
 * @desc    Search for foods in database
 * @access  Private
 */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { query, limit = 20 } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { foods: [] }
      });
    }

    // Check cache first
    const cacheKey = `food_search:${query.toLowerCase()}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: { foods: cached, cached: true }
      });
    }

    // Search in database
    const foods = await NutritionData.searchByName(query, parseInt(limit));

    // Cache results for 1 hour
    await setCache(cacheKey, foods, 3600);

    res.json({
      success: true,
      data: { foods }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
