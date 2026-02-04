/**
 * Glycemic Index Reference Model (PostgreSQL)
 * 
 * Stores glycemic index values for foods,
 * sourced from clinical studies and databases.
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../../config/postgres');

const GlycemicIndex = sequelize.define('gi_reference', {
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
    field: 'food_name_normalized'
  },
  
  // Alternative names for better matching
  alternativeNames: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'alternative_names'
  },
  
  // GI value (0-100 scale)
  giValue: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'gi_value',
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // GI category
  giCategory: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    allowNull: false,
    field: 'gi_category',
    comment: 'Low: <55, Medium: 56-69, High: ≥70'
  },
  
  // Reference glucose standard
  referenceFood: {
    type: DataTypes.STRING(50),
    defaultValue: 'glucose',
    field: 'reference_food',
    comment: 'glucose or white_bread'
  },
  
  // Serving information for GL calculation
  servingSizeG: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'serving_size_g'
  },
  
  carbsPerServing: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'carbs_per_serving'
  },
  
  // Pre-calculated GL for standard serving
  glPerServing: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'gl_per_serving',
    comment: 'GL = (GI × Net Carbs) / 100'
  },
  
  glCategory: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    field: 'gl_category',
    comment: 'Low: <10, Medium: 11-19, High: ≥20'
  },
  
  // Food category
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Data source and reliability
  source: {
    type: DataTypes.STRING(255),
    comment: 'Study or database source'
  },
  
  year: {
    type: DataTypes.INTEGER,
    comment: 'Year of study/data'
  },
  
  reliabilityScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0,
    field: 'reliability_score',
    comment: 'Score 0-1 based on study quality'
  },
  
  // Additional notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'gi_reference',
  timestamps: true,
  indexes: [
    { fields: ['food_name_normalized'] },
    { fields: ['gi_category'] },
    { fields: ['category'] }
  ],
  hooks: {
    beforeSave: (instance) => {
      // Normalize food name
      instance.foodNameNormalized = instance.foodName.toLowerCase().trim();
      
      // Calculate GI category
      if (instance.giValue < 55) {
        instance.giCategory = 'low';
      } else if (instance.giValue < 70) {
        instance.giCategory = 'medium';
      } else {
        instance.giCategory = 'high';
      }
      
      // Calculate GL if we have carb data
      if (instance.giValue && instance.carbsPerServing) {
        instance.glPerServing = (instance.giValue * instance.carbsPerServing) / 100;
        
        // Calculate GL category
        if (instance.glPerServing < 10) {
          instance.glCategory = 'low';
        } else if (instance.glPerServing < 20) {
          instance.glCategory = 'medium';
        } else {
          instance.glCategory = 'high';
        }
      }
    }
  }
});

// ===========================================
// Static Methods
// ===========================================

/**
 * Find GI by food name (fuzzy search)
 * @param {string} foodName - Food name to search
 * @returns {Promise<GlycemicIndex>} GI data
 */
GlycemicIndex.findByFoodName = async function(foodName) {
  const normalized = foodName.toLowerCase().trim();
  
  // Try exact match first
  let result = await this.findOne({
    where: { foodNameNormalized: normalized }
  });
  
  if (result) return result;
  
  // Try partial match
  result = await this.findOne({
    where: {
      foodNameNormalized: {
        [Op.like]: `%${normalized}%`
      }
    }
  });
  
  if (result) return result;
  
  // Try alternative names
  result = await this.findOne({
    where: {
      alternativeNames: {
        [Op.contains]: [normalized]
      }
    }
  });
  
  return result;
};

/**
 * Calculate Glycemic Load for a portion
 * @param {string} foodName - Food name
 * @param {number} carbGrams - Net carbs in grams
 * @returns {Promise<Object>} GL value and category
 */
GlycemicIndex.calculateGL = async function(foodName, carbGrams) {
  const giData = await this.findByFoodName(foodName);
  
  if (!giData) {
    return {
      value: null,
      category: 'unknown',
      message: 'GI data not found for this food'
    };
  }
  
  const glValue = (giData.giValue * carbGrams) / 100;
  
  let category = 'unknown';
  if (glValue < 10) category = 'low';
  else if (glValue < 20) category = 'medium';
  else category = 'high';
  
  return {
    value: Math.round(glValue * 10) / 10,
    category,
    giValue: giData.giValue,
    giCategory: giData.giCategory,
    foodName: giData.foodName
  };
};

/**
 * Get foods by GI category
 * @param {string} category - GI category (low/medium/high)
 * @param {string} foodCategory - Optional food category filter
 * @returns {Promise<Array>} Foods in category
 */
GlycemicIndex.getByCategory = function(category, foodCategory = null) {
  const where = { giCategory: category };
  
  if (foodCategory) {
    where.category = foodCategory;
  }
  
  return this.findAll({
    where,
    order: [['gi_value', 'ASC']]
  });
};

/**
 * Get low GI alternatives for a food
 * @param {string} foodName - Food to find alternatives for
 * @returns {Promise<Array>} Low GI alternatives
 */
GlycemicIndex.getLowGIAlternatives = async function(foodName) {
  const food = await this.findByFoodName(foodName);
  
  if (!food) return [];
  
  // Find foods in same category with lower GI
  return this.findAll({
    where: {
      category: food.category,
      giCategory: 'low',
      id: { [Op.ne]: food.id }
    },
    order: [['gi_value', 'ASC']],
    limit: 5
  });
};

/**
 * Get GI statistics for a food category
 * @param {string} category - Food category
 * @returns {Promise<Object>} Statistics
 */
GlycemicIndex.getCategoryStats = async function(category) {
  const result = await this.findAll({
    where: { category },
    attributes: [
      [sequelize.fn('AVG', sequelize.col('gi_value')), 'avgGI'],
      [sequelize.fn('MIN', sequelize.col('gi_value')), 'minGI'],
      [sequelize.fn('MAX', sequelize.col('gi_value')), 'maxGI'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    raw: true
  });
  
  return result[0];
};

module.exports = GlycemicIndex;
