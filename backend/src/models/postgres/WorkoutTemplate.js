/**
 * Workout Templates Model (PostgreSQL)
 * 
 * Stores pre-defined workout templates and exercises
 * for generating personalized workout plans.
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../../config/postgres');

const WorkoutTemplate = sequelize.define('workout_template', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Template identification
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Goal targeting
  goalType: {
    type: DataTypes.ENUM('fat_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_fitness'),
    allowNull: false,
    field: 'goal_type'
  },
  
  // Workout classification
  workoutType: {
    type: DataTypes.ENUM(
      'strength', 
      'cardio', 
      'hiit', 
      'flexibility', 
      'circuit', 
      'functional',
      'recovery'
    ),
    allowNull: false,
    field: 'workout_type'
  },
  
  // Target muscle groups
  muscleGroups: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'muscle_groups',
    comment: 'e.g., ["chest", "triceps", "shoulders"]'
  },
  
  // Difficulty level
  difficulty: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    allowNull: false,
    defaultValue: 'intermediate'
  },
  
  // Duration
  durationMinutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duration_minutes'
  },
  
  // Estimated calorie burn
  estimatedCaloriesBurn: {
    type: DataTypes.INTEGER,
    field: 'estimated_calories_burn',
    comment: 'Estimated for average person'
  },
  
  // Equipment required
  equipmentRequired: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'equipment_required'
  },
  
  // No equipment alternative available
  hasNoEquipmentVersion: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'has_no_equipment_version'
  },
  
  // Exercises in this workout (JSONB for flexibility)
  exercises: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of exercise objects with sets, reps, duration, rest'
  },
  
  // Warmup routine
  warmup: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of warmup exercises'
  },
  
  // Cooldown routine
  cooldown: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array of cooldown exercises'
  },
  
  // Instructions and tips
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  tips: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Activity level requirement
  activityLevelRequired: {
    type: DataTypes.ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'),
    defaultValue: 'moderately_active',
    field: 'activity_level_required'
  },
  
  // Image/video references
  imageUrl: {
    type: DataTypes.STRING(500),
    field: 'image_url'
  },
  
  videoUrl: {
    type: DataTypes.STRING(500),
    field: 'video_url'
  },
  
  // Rating and popularity
  averageRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    field: 'average_rating'
  },
  
  timesUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'times_used'
  },
  
  // Active status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'workout_templates',
  timestamps: true,
  indexes: [
    { fields: ['goal_type'] },
    { fields: ['workout_type'] },
    { fields: ['difficulty'] },
    { fields: ['goal_type', 'difficulty'] }
  ]
});

// ===========================================
// Static Methods
// ===========================================

/**
 * Get workouts by goal
 * @param {string} goal - Fitness goal
 * @param {Object} filters - Additional filters
 * @returns {Promise<Array>} Matching workouts
 */
WorkoutTemplate.getByGoal = function(goal, filters = {}) {
  const where = { 
    goalType: goal,
    isActive: true
  };
  
  if (filters.difficulty) where.difficulty = filters.difficulty;
  if (filters.workoutType) where.workoutType = filters.workoutType;
  if (filters.maxDuration) {
    where.durationMinutes = { [Op.lte]: filters.maxDuration };
  }
  
  return this.findAll({
    where,
    order: [['times_used', 'DESC']]
  });
};

/**
 * Get a 7-day workout plan
 * @param {string} goal - Fitness goal
 * @param {string} difficulty - User difficulty level
 * @returns {Promise<Array>} 7-day workout plan
 */
WorkoutTemplate.generate7DayPlan = async function(goal, difficulty) {
  const workouts = await this.getByGoal(goal, { difficulty });
  
  if (workouts.length === 0) {
    return null;
  }
  
  // Create balanced 7-day plan
  const plan = [];
  const workoutTypes = ['strength', 'cardio', 'strength', 'hiit', 'strength', 'cardio', 'recovery'];
  
  for (let day = 0; day < 7; day++) {
    const targetType = workoutTypes[day];
    
    // Find workout matching the target type
    let workout = workouts.find(w => w.workoutType === targetType);
    
    // Fallback to any workout if specific type not found
    if (!workout) {
      workout = workouts[day % workouts.length];
    }
    
    plan.push({
      day: day + 1,
      dayName: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][day],
      workout: {
        id: workout.id,
        name: workout.name,
        type: workout.workoutType,
        duration: workout.durationMinutes,
        exercises: workout.exercises,
        warmup: workout.warmup,
        cooldown: workout.cooldown,
        estimatedCalories: workout.estimatedCaloriesBurn
      }
    });
  }
  
  return plan;
};

/**
 * Get no-equipment workouts
 * @param {string} goal - Fitness goal
 * @returns {Promise<Array>} No-equipment workouts
 */
WorkoutTemplate.getNoEquipmentWorkouts = function(goal) {
  return this.findAll({
    where: {
      goalType: goal,
      hasNoEquipmentVersion: true,
      isActive: true
    }
  });
};

/**
 * Get workouts by muscle group
 * @param {string} muscleGroup - Target muscle group
 * @returns {Promise<Array>} Matching workouts
 */
WorkoutTemplate.getByMuscleGroup = function(muscleGroup) {
  return this.findAll({
    where: {
      muscleGroups: { [Op.contains]: [muscleGroup] },
      isActive: true
    }
  });
};

/**
 * Increment usage count
 * @param {number} id - Template ID
 * @returns {Promise<WorkoutTemplate>} Updated template
 */
WorkoutTemplate.incrementUsage = function(id) {
  return this.increment('timesUsed', { where: { id } });
};

module.exports = WorkoutTemplate;
