/**
 * Progress Tracking Routes
 * 
 * Handles weight logging, progress statistics,
 * and chart data for tracking user progress.
 */

const express = require('express');
const router = express.Router();
const { WeightLog, FoodLog } = require('../models/mongodb');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, createWeightLogSchema } = require('../middleware/validation');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

/**
 * @route   POST /api/v1/progress/weight
 * @desc    Log weight entry
 * @access  Private
 */
router.post('/weight', authenticate, validate(createWeightLogSchema), async (req, res, next) => {
  try {
    const weightData = {
      userId: req.userId,
      ...req.validatedBody
    };

    // Convert lbs to kg if necessary
    if (weightData.unit === 'lbs') {
      weightData.weight = weightData.weight / 2.20462;
    }

    const weightLog = new WeightLog(weightData);
    await weightLog.save();

    // Update user's current weight
    req.user.physicalAttributes.weight = weightData.weight;
    await req.user.save();

    logger.info(`Weight logged for user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Weight logged successfully',
      data: { weightLog }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/weight
 * @desc    Get weight history
 * @access  Private
 */
router.get('/weight', authenticate, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const history = await WeightLog.getHistory(req.userId, parseInt(days));

    res.json({
      success: true,
      data: { 
        history,
        count: history.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/weight/latest
 * @desc    Get latest weight entry
 * @access  Private
 */
router.get('/weight/latest', authenticate, async (req, res, next) => {
  try {
    const latest = await WeightLog.getLatest(req.userId);

    res.json({
      success: true,
      data: { latest }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/weight/stats
 * @desc    Get weight statistics
 * @access  Private
 */
router.get('/weight/stats', authenticate, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const stats = await WeightLog.getStatistics(req.userId, parseInt(days));

    if (!stats) {
      return res.json({
        success: true,
        data: { stats: null, message: 'No weight data available' }
      });
    }

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/weight/chart
 * @desc    Get weight data formatted for charts
 * @access  Private
 */
router.get('/weight/chart', authenticate, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const chartData = await WeightLog.getChartData(req.userId, parseInt(days));

    res.json({
      success: true,
      data: { chartData }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/progress/weight/:id
 * @desc    Delete weight entry
 * @access  Private
 */
router.delete('/weight/:id', authenticate, async (req, res, next) => {
  try {
    const log = await WeightLog.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!log) {
      throw new APIError('Weight log not found', 404, 'LOG_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Weight log deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/calories
 * @desc    Get calorie consumption history
 * @access  Private
 */
router.get('/calories', authenticate, async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const logs = await FoodLog.find({
      userId: req.userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Aggregate by date
    const dailyCalories = {};
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      if (!dailyCalories[dateKey]) {
        dailyCalories[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: 0
        };
      }
      dailyCalories[dateKey].calories += log.totals.calories;
      dailyCalories[dateKey].protein += log.totals.protein;
      dailyCalories[dateKey].carbs += log.totals.carbohydrates;
      dailyCalories[dateKey].fat += log.totals.fat;
      dailyCalories[dateKey].meals += 1;
    });

    const calorieHistory = Object.values(dailyCalories);

    res.json({
      success: true,
      data: {
        history: calorieHistory,
        target: req.user.calculatedMetrics.dailyCalorieTarget
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/calories/chart
 * @desc    Get calorie data formatted for charts
 * @access  Private
 */
router.get('/calories/chart', authenticate, async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const logs = await FoodLog.find({
      userId: req.userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Prepare chart data
    const labels = [];
    const caloriesData = [];
    const targetData = [];
    const target = req.user.calculatedMetrics.dailyCalorieTarget;

    const dailyData = {};
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      dailyData[dateKey] = (dailyData[dateKey] || 0) + log.totals.calories;
    });

    // Fill in all days
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      
      labels.push(dateKey);
      caloriesData.push(dailyData[dateKey] || 0);
      targetData.push(target);
    }

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Calories Consumed',
          data: caloriesData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1
        },
        {
          label: 'Target',
          data: targetData,
          borderColor: 'rgb(255, 99, 132)',
          borderDash: [5, 5],
          tension: 0
        }
      ]
    };

    res.json({
      success: true,
      data: { chartData }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/progress/summary
 * @desc    Get overall progress summary
 * @access  Private
 */
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    // Get weight stats
    const weightStats = await WeightLog.getStatistics(req.userId, 30);

    // Get today's food logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysSummary = await FoodLog.getDailySummary(req.userId, today);

    // Calculate progress towards goals
    const goalProgress = {
      caloriesConsumed: todaysSummary.totals.calories,
      caloriesTarget: req.user.calculatedMetrics.dailyCalorieTarget,
      caloriesRemaining: Math.max(0, req.user.calculatedMetrics.dailyCalorieTarget - todaysSummary.totals.calories),
      proteinConsumed: todaysSummary.totals.protein,
      proteinTarget: req.user.calculatedMetrics.macroTargets?.protein,
      carbsConsumed: todaysSummary.totals.carbohydrates,
      carbsTarget: req.user.calculatedMetrics.macroTargets?.carbs,
      fatConsumed: todaysSummary.totals.fat,
      fatTarget: req.user.calculatedMetrics.macroTargets?.fat
    };

    res.json({
      success: true,
      data: {
        weightStats,
        todaysProgress: goalProgress,
        mealsLoggedToday: todaysSummary.mealsLogged,
        userMetrics: req.user.calculatedMetrics
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
