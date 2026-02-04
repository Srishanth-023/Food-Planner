/**
 * Nutrition Data Model (PostgreSQL)
 * 
 * Stores comprehensive nutritional information for foods,
 * sourced from USDA FoodData Central and other databases.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/postgres');

const NutritionData = sequelize.define('nutrition_data', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Food identification
  foodName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'food_name'
  },
  
  foodNameNormalized: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'food_name_normalized',
    comment: 'Lowercase, trimmed version for searching'
  },
  
  // External references
  usdaFdcId: {
    type: DataTypes.STRING(50),
    field: 'usda_fdc_id',
    unique: true
  },
  
  openFoodFactsId: {
    type: DataTypes.STRING(100),
    field: 'open_food_facts_id'
  },
  
  // Food categorization
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  subcategory: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Brand (for packaged foods)
  brand: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // Serving information
  servingSizeG: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 100,
    field: 'serving_size_g',
    comment: 'Standard serving size in grams'
  },
  
  servingDescription: {
    type: DataTypes.STRING(100),
    field: 'serving_description',
    comment: 'e.g., "1 cup", "1 medium apple"'
  },
  
  // Macronutrients (per 100g)
  caloriesPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'calories_per_100g'
  },
  
  proteinPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'protein_per_100g'
  },
  
  carbohydratesPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'carbohydrates_per_100g'
  },
  
  fatPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'fat_per_100g'
  },
  
  fiberPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'fiber_per_100g'
  },
  
  sugarPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'sugar_per_100g'
  },
  
  // Fat breakdown
  saturatedFatPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'saturated_fat_per_100g'
  },
  
  transFatPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'trans_fat_per_100g'
  },
  
  monounsaturatedFatPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'monounsaturated_fat_per_100g'
  },
  
  polyunsaturatedFatPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'polyunsaturated_fat_per_100g'
  },
  
  // Minerals (mg per 100g)
  sodiumPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'sodium_per_100g'
  },
  
  potassiumPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'potassium_per_100g'
  },
  
  calciumPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'calcium_per_100g'
  },
  
  ironPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'iron_per_100g'
  },
  
  magnesiumPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'magnesium_per_100g'
  },
  
  zincPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'zinc_per_100g'
  },
  
  // Vitamins
  vitaminAPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_a_per_100g',
    comment: 'mcg RAE'
  },
  
  vitaminCPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_c_per_100g',
    comment: 'mg'
  },
  
  vitaminDPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_d_per_100g',
    comment: 'mcg'
  },
  
  vitaminEPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_e_per_100g',
    comment: 'mg'
  },
  
  vitaminKPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_k_per_100g',
    comment: 'mcg'
  },
  
  vitaminB6Per100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_b6_per_100g',
    comment: 'mg'
  },
  
  vitaminB12Per100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'vitamin_b12_per_100g',
    comment: 'mcg'
  },
  
  folatePer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'folate_per_100g',
    comment: 'mcg DFE'
  },
  
  // Other
  cholesterolPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'cholesterol_per_100g',
    comment: 'mg'
  },
  
  caffeinePer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'caffeine_per_100g',
    comment: 'mg'
  },
  
  alcoholPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'alcohol_per_100g',
    comment: 'g'
  },
  
  waterPer100g: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    field: 'water_per_100g',
    comment: 'g'
  },
  
  // Dietary flags
  isVegetarian: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_vegetarian'
  },
  
  isVegan: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_vegan'
  },
  
  isGlutenFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_gluten_free'
  },
  
  isDairyFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_dairy_free'
  },
  
  // Contains allergens
  containsNuts: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'contains_nuts'
  },
  
  containsShellfish: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'contains_shellfish'
  },
  
  containsEggs: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'contains_eggs'
  },
  
  containsSoy: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'contains_soy'
  },
  
  containsWheat: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'contains_wheat'
  },
  
  // Data quality
  dataSource: {
    type: DataTypes.STRING(100),
    defaultValue: 'usda',
    field: 'data_source'
  },
  
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_updated'
  },
  
  dataQualityScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0,
    field: 'data_quality_score',
    comment: 'Score from 0-1 indicating data completeness'
  }
}, {
  tableName: 'nutrition_data',
  timestamps: true,
  indexes: [
    { fields: ['food_name_normalized'] },
    { fields: ['category'] },
    { fields: ['usda_fdc_id'] },
    { fields: ['is_vegetarian', 'is_vegan'] }
  ]
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Calculate nutrition for a specific portion
 * @param {number} portionGrams - Portion size in grams
 * @returns {Object} Nutrition values for portion
 */
NutritionData.prototype.calculateForPortion = function(portionGrams) {
  const multiplier = portionGrams / 100;
  
  return {
    calories: Math.round(this.caloriesPer100g * multiplier),
    protein: Math.round(this.proteinPer100g * multiplier * 10) / 10,
    carbohydrates: Math.round(this.carbohydratesPer100g * multiplier * 10) / 10,
    fat: Math.round(this.fatPer100g * multiplier * 10) / 10,
    fiber: Math.round(this.fiberPer100g * multiplier * 10) / 10,
    sugar: Math.round(this.sugarPer100g * multiplier * 10) / 10,
    sodium: Math.round(this.sodiumPer100g * multiplier),
    saturatedFat: Math.round(this.saturatedFatPer100g * multiplier * 10) / 10,
    cholesterol: Math.round(this.cholesterolPer100g * multiplier)
  };
};

// ===========================================
// Static Methods
// ===========================================

/**
 * Search for foods by name
 * @param {string} query - Search query
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Matching foods
 */
NutritionData.searchByName = async function(query, limit = 20) {
  const normalizedQuery = query.toLowerCase().trim();
  
  return this.findAll({
    where: sequelize.where(
      sequelize.fn('LOWER', sequelize.col('food_name')),
      'LIKE',
      `%${normalizedQuery}%`
    ),
    limit,
    order: [
      [sequelize.fn('LENGTH', sequelize.col('food_name')), 'ASC']
    ]
  });
};

/**
 * Find exact match by food name
 * @param {string} foodName - Food name to find
 * @returns {Promise<NutritionData>} Food data
 */
NutritionData.findByExactName = function(foodName) {
  return this.findOne({
    where: {
      foodNameNormalized: foodName.toLowerCase().trim()
    }
  });
};

/**
 * Get foods by category
 * @param {string} category - Category name
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Foods in category
 */
NutritionData.getByCategory = function(category, filters = {}) {
  const where = { category };
  
  if (filters.isVegetarian) where.isVegetarian = true;
  if (filters.isVegan) where.isVegan = true;
  if (filters.isGlutenFree) where.isGlutenFree = true;
  
  return this.findAll({
    where,
    order: [['food_name', 'ASC']]
  });
};

module.exports = NutritionData;
