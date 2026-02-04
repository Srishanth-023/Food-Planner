/**
 * Food Log Model (MongoDB)
 * 
 * Stores daily food intake logs with nutritional information,
 * including calories, macros, GI, and GL values.
 */

const mongoose = require('mongoose');

// Schema for individual food items in a log
const foodItemSchema = new mongoose.Schema({
  // Food identification
  foodName: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  
  // Source of identification
  source: {
    type: String,
    enum: ['ai_detection', 'manual_entry', 'barcode_scan', 'usda_search'],
    default: 'manual_entry'
  },
  
  // Portion information
  portion: {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Portion amount must be positive']
    },
    unit: {
      type: String,
      enum: ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving'],
      default: 'g'
    },
    servingSize: {
      type: Number, // Standard serving size in grams
      default: 100
    }
  },
  
  // Nutritional information
  nutrition: {
    calories: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      default: 0,
      min: 0
    },
    carbohydrates: {
      type: Number,
      default: 0,
      min: 0
    },
    fat: {
      type: Number,
      default: 0,
      min: 0
    },
    fiber: {
      type: Number,
      default: 0,
      min: 0
    },
    sugar: {
      type: Number,
      default: 0,
      min: 0
    },
    sodium: {
      type: Number, // mg
      default: 0,
      min: 0
    },
    saturatedFat: {
      type: Number,
      default: 0,
      min: 0
    },
    cholesterol: {
      type: Number, // mg
      default: 0,
      min: 0
    }
  },
  
  // Glycemic values
  glycemicIndex: {
    value: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    category: {
      type: String,
      enum: ['low', 'medium', 'high', 'unknown'],
      default: 'unknown'
    }
  },
  
  glycemicLoad: {
    value: {
      type: Number,
      min: 0,
      default: null
    },
    category: {
      type: String,
      enum: ['low', 'medium', 'high', 'unknown'],
      default: 'unknown'
    }
  },
  
  // Image reference (if detected from image)
  imageAnalysis: {
    imageUrl: String,
    boundingBox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  
  // External references
  references: {
    usdaId: String,
    openFoodFactsId: String,
    nutritionDbId: String
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: 500
  }
}, { _id: true });

// Main food log schema
const foodLogSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Date of the log
  date: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    },
    index: true
  },
  
  // Meal type
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'other'],
    required: [true, 'Meal type is required']
  },
  
  // Time of the meal
  mealTime: {
    type: Date,
    default: Date.now
  },
  
  // Food items in this log
  foods: [foodItemSchema],
  
  // Aggregated totals for the meal
  totals: {
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    carbohydrates: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    fiber: {
      type: Number,
      default: 0
    },
    averageGI: {
      type: Number,
      default: null
    },
    totalGL: {
      type: Number,
      default: null
    }
  },
  
  // Image URL if the whole meal was photographed
  mealImageUrl: {
    type: String,
    default: null
  },
  
  // User notes about the meal
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // Flag for verification
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// Indexes
// ===========================================

foodLogSchema.index({ userId: 1, date: -1 });
foodLogSchema.index({ userId: 1, mealType: 1, date: -1 });

// ===========================================
// Pre-save Middleware
// ===========================================

// Calculate totals before saving
foodLogSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Calculate totals from all food items
 */
foodLogSchema.methods.calculateTotals = function() {
  if (!this.foods || this.foods.length === 0) {
    this.totals = {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      averageGI: null,
      totalGL: null
    };
    return;
  }
  
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let giSum = 0;
  let giCount = 0;
  let totalGL = 0;
  
  this.foods.forEach(food => {
    totalCalories += food.nutrition.calories || 0;
    totalProtein += food.nutrition.protein || 0;
    totalCarbs += food.nutrition.carbohydrates || 0;
    totalFat += food.nutrition.fat || 0;
    totalFiber += food.nutrition.fiber || 0;
    
    // Calculate GI average (only for foods with GI values)
    if (food.glycemicIndex.value !== null) {
      giSum += food.glycemicIndex.value;
      giCount++;
    }
    
    // Sum GL values
    if (food.glycemicLoad.value !== null) {
      totalGL += food.glycemicLoad.value;
    }
  });
  
  this.totals = {
    calories: Math.round(totalCalories),
    protein: Math.round(totalProtein * 10) / 10,
    carbohydrates: Math.round(totalCarbs * 10) / 10,
    fat: Math.round(totalFat * 10) / 10,
    fiber: Math.round(totalFiber * 10) / 10,
    averageGI: giCount > 0 ? Math.round(giSum / giCount) : null,
    totalGL: totalGL > 0 ? Math.round(totalGL * 10) / 10 : null
  };
};

/**
 * Calculate Glycemic Load for a food item
 * GL = (GI × Net Carbs) / 100
 * @param {Object} food - Food item object
 * @returns {Object} GL value and category
 */
foodLogSchema.methods.calculateGL = function(food) {
  if (!food.glycemicIndex.value || !food.nutrition.carbohydrates) {
    return { value: null, category: 'unknown' };
  }
  
  const netCarbs = food.nutrition.carbohydrates - (food.nutrition.fiber || 0);
  const gl = (food.glycemicIndex.value * netCarbs) / 100;
  
  let category = 'unknown';
  if (gl < 10) category = 'low';
  else if (gl <= 19) category = 'medium';
  else category = 'high';
  
  return {
    value: Math.round(gl * 10) / 10,
    category
  };
};

// ===========================================
// Static Methods
// ===========================================

/**
 * Get daily summary for a user
 * @param {ObjectId} userId - User ID
 * @param {Date} date - Date to get summary for
 * @returns {Promise<Object>} Daily summary
 */
foodLogSchema.statics.getDailySummary = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const logs = await this.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  
  const summary = {
    date: startOfDay,
    mealsLogged: logs.length,
    totals: {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0
    },
    meals: {
      breakfast: null,
      lunch: null,
      dinner: null,
      snacks: []
    }
  };
  
  logs.forEach(log => {
    summary.totals.calories += log.totals.calories;
    summary.totals.protein += log.totals.protein;
    summary.totals.carbohydrates += log.totals.carbohydrates;
    summary.totals.fat += log.totals.fat;
    summary.totals.fiber += log.totals.fiber;
    
    if (log.mealType === 'snack') {
      summary.meals.snacks.push(log);
    } else {
      summary.meals[log.mealType] = log;
    }
  });
  
  return summary;
};

/**
 * Get weekly statistics for a user
 * @param {ObjectId} userId - User ID
 * @param {Date} startDate - Start date of the week
 * @returns {Promise<Array>} Array of daily summaries
 */
foodLogSchema.statics.getWeeklyStats = async function(userId, startDate) {
  const stats = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const summary = await this.getDailySummary(userId, date);
    stats.push(summary);
  }
  
  return stats;
};

const FoodLog = mongoose.model('FoodLog', foodLogSchema);

module.exports = FoodLog;
