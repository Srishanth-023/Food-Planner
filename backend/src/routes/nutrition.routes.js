/**
 * Nutrition Routes
 * 
 * Handles nutrition data lookup, GI search,
 * and food database queries.
 */

const express = require('express');
const router = express.Router();
const { NutritionData, GlycemicIndex } = require('../models/postgres');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');
const { setCache, getCache } = require('../config/redis');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * @route   GET /api/v1/nutrition/search
 * @desc    Search nutrition database
 * @access  Public (with optional auth for personalization)
 */
router.get('/search', optionalAuth, async (req, res, next) => {
  try {
    const { query, limit = 20, category } = req.query;

    if (!query || query.length < 2) {
      return res.json({
        success: true,
        data: { foods: [], total: 0 }
      });
    }

    // Check cache
    const cacheKey = `nutrition_search:${query.toLowerCase()}:${category || 'all'}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json({
        success: true,
        data: { foods: cached, total: cached.length, cached: true }
      });
    }

    const foods = await NutritionData.searchByName(query, parseInt(limit));

    // Cache for 1 hour
    await setCache(cacheKey, foods, 3600);

    res.json({
      success: true,
      data: { foods, total: foods.length }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/nutrition/food/:id
 * @desc    Get detailed nutrition data for a food
 * @access  Public
 */
router.get('/food/:id', async (req, res, next) => {
  try {
    const food = await NutritionData.findByPk(req.params.id);

    if (!food) {
      throw new APIError('Food not found', 404, 'FOOD_NOT_FOUND');
    }

    // Also get GI data if available
    const giData = await GlycemicIndex.findByFoodName(food.foodName);

    res.json({
      success: true,
      data: {
        food,
        glycemicIndex: giData ? {
          value: giData.giValue,
          category: giData.giCategory,
          glPerServing: giData.glPerServing,
          glCategory: giData.glCategory
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/nutrition/gi/lookup
 * @desc    Look up Glycemic Index for a food
 * @access  Public
 */
router.get('/gi/lookup', async (req, res, next) => {
  try {
    const { food } = req.query;

    if (!food) {
      throw new APIError('Food name is required', 400, 'MISSING_FOOD');
    }

    const giData = await GlycemicIndex.findByFoodName(food);

    if (!giData) {
      return res.json({
        success: true,
        data: {
          found: false,
          message: 'GI data not found for this food'
        }
      });
    }

    res.json({
      success: true,
      data: {
        found: true,
        food: giData.foodName,
        gi: {
          value: giData.giValue,
          category: giData.giCategory
        },
        gl: giData.glPerServing ? {
          perServing: giData.glPerServing,
          category: giData.glCategory,
          servingSize: giData.servingSizeG
        } : null,
        source: giData.source
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/nutrition/gi/calculate
 * @desc    Calculate Glycemic Load for a food portion
 * @access  Public
 */
router.post('/gi/calculate', async (req, res, next) => {
  try {
    const { foodName, carbGrams, giValue } = req.body;

    if (!carbGrams) {
      throw new APIError('Carbohydrate amount is required', 400, 'MISSING_CARBS');
    }

    let gi = giValue;

    // Look up GI if not provided
    if (!gi && foodName) {
      const giData = await GlycemicIndex.findByFoodName(foodName);
      if (giData) {
        gi = giData.giValue;
      }
    }

    if (!gi) {
      return res.json({
        success: true,
        data: {
          calculated: false,
          message: 'GI value not found. Please provide GI value or a food name with known GI.'
        }
      });
    }

    // Calculate GL = (GI × Net Carbs) / 100
    const gl = (gi * carbGrams) / 100;
    
    let category = 'unknown';
    if (gl < 10) category = 'low';
    else if (gl < 20) category = 'medium';
    else category = 'high';

    res.json({
      success: true,
      data: {
        calculated: true,
        gi: gi,
        carbs: carbGrams,
        gl: Math.round(gl * 10) / 10,
        category,
        interpretation: {
          low: 'Minimal impact on blood sugar',
          medium: 'Moderate impact on blood sugar',
          high: 'Significant impact on blood sugar'
        }[category]
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/nutrition/gi/categories/:category
 * @desc    Get foods by GI category
 * @access  Public
 */
router.get('/gi/categories/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    const { foodCategory } = req.query;

    if (!['low', 'medium', 'high'].includes(category)) {
      throw new APIError('Invalid GI category. Use: low, medium, or high', 400, 'INVALID_CATEGORY');
    }

    const foods = await GlycemicIndex.getByCategory(category, foodCategory);

    res.json({
      success: true,
      data: {
        category,
        foods,
        count: foods.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/nutrition/gi/alternatives/:food
 * @desc    Get low GI alternatives for a food
 * @access  Public
 */
router.get('/gi/alternatives/:food', async (req, res, next) => {
  try {
    const alternatives = await GlycemicIndex.getLowGIAlternatives(req.params.food);

    res.json({
      success: true,
      data: {
        originalFood: req.params.food,
        alternatives
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/nutrition/categories
 * @desc    Get list of food categories
 * @access  Public
 */
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await NutritionData.findAll({
      attributes: [[NutritionData.sequelize.fn('DISTINCT', NutritionData.sequelize.col('category')), 'category']],
      where: {
        category: { [NutritionData.sequelize.Op.ne]: null }
      },
      raw: true
    });

    res.json({
      success: true,
      data: {
        categories: categories.map(c => c.category).filter(Boolean).sort()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/nutrition/calculate-portion
 * @desc    Calculate nutrition for a specific portion
 * @access  Public
 */
router.post('/calculate-portion', async (req, res, next) => {
  try {
    const { foodId, portionGrams } = req.body;

    if (!foodId || !portionGrams) {
      throw new APIError('Food ID and portion size are required', 400, 'MISSING_PARAMS');
    }

    const food = await NutritionData.findByPk(foodId);

    if (!food) {
      throw new APIError('Food not found', 404, 'FOOD_NOT_FOUND');
    }

    const nutrition = food.calculateForPortion(portionGrams);

    // Get GI/GL if available
    const giData = await GlycemicIndex.findByFoodName(food.foodName);
    let glycemicLoad = null;

    if (giData) {
      const gl = (giData.giValue * nutrition.carbohydrates) / 100;
      glycemicLoad = {
        value: Math.round(gl * 10) / 10,
        category: gl < 10 ? 'low' : gl < 20 ? 'medium' : 'high'
      };
    }

    res.json({
      success: true,
      data: {
        food: food.foodName,
        portion: `${portionGrams}g`,
        nutrition,
        glycemicIndex: giData ? {
          value: giData.giValue,
          category: giData.giCategory
        } : null,
        glycemicLoad
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
