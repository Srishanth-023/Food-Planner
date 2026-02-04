/**
 * Weight Log Model (MongoDB)
 * 
 * Stores weight tracking data for users to monitor
 * their progress over time.
 */

const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Weight value
  weight: {
    type: Number, // in kg
    required: [true, 'Weight is required'],
    min: [20, 'Weight must be at least 20kg'],
    max: [500, 'Weight cannot exceed 500kg']
  },
  
  // Unit preference (stored value is always in kg)
  unit: {
    type: String,
    enum: ['kg', 'lbs'],
    default: 'kg'
  },
  
  // Date of measurement
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  
  // Time of measurement
  timeOfDay: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'not_specified'],
    default: 'morning'
  },
  
  // Body measurements (optional)
  measurements: {
    bodyFatPercentage: {
      type: Number,
      min: 1,
      max: 60
    },
    muscleMass: {
      type: Number, // in kg
      min: 0
    },
    waterPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    boneMass: {
      type: Number, // in kg
      min: 0
    },
    waistCircumference: {
      type: Number, // in cm
      min: 0
    },
    hipCircumference: {
      type: Number, // in cm
      min: 0
    },
    chestCircumference: {
      type: Number, // in cm
      min: 0
    },
    armCircumference: {
      type: Number, // in cm
      min: 0
    },
    thighCircumference: {
      type: Number, // in cm
      min: 0
    }
  },
  
  // Notes
  notes: {
    type: String,
    maxlength: 500
  },
  
  // Source of measurement
  source: {
    type: String,
    enum: ['manual', 'smart_scale', 'fitness_tracker'],
    default: 'manual'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// Indexes
// ===========================================

weightLogSchema.index({ userId: 1, date: -1 });
weightLogSchema.index({ userId: 1, createdAt: -1 });

// ===========================================
// Virtual Properties
// ===========================================

// Convert to lbs if needed
weightLogSchema.virtual('weightInLbs').get(function() {
  return Math.round(this.weight * 2.20462 * 10) / 10;
});

// Calculate BMI if user height is available
weightLogSchema.virtual('bmi').get(function() {
  // This would need to be populated with user data
  return null;
});

// ===========================================
// Static Methods
// ===========================================

/**
 * Get weight history for a user
 * @param {ObjectId} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Promise<Array>} Weight entries
 */
weightLogSchema.statics.getHistory = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.find({
    userId,
    date: { $gte: startDate }
  }).sort({ date: 1 });
};

/**
 * Get latest weight entry for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<WeightLog>} Latest weight entry
 */
weightLogSchema.statics.getLatest = function(userId) {
  return this.findOne({ userId }).sort({ date: -1 });
};

/**
 * Get weight statistics for a user
 * @param {ObjectId} userId - User ID
 * @param {number} days - Number of days to analyze
 * @returns {Promise<Object>} Statistics object
 */
weightLogSchema.statics.getStatistics = async function(userId, days = 30) {
  const history = await this.getHistory(userId, days);
  
  if (history.length === 0) {
    return null;
  }
  
  const weights = history.map(entry => entry.weight);
  const startWeight = weights[0];
  const currentWeight = weights[weights.length - 1];
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
  const totalChange = currentWeight - startWeight;
  
  // Calculate weekly average change
  const weeklyChange = history.length > 7 
    ? (currentWeight - history[Math.max(0, history.length - 8)].weight) 
    : totalChange;
  
  return {
    startWeight: Math.round(startWeight * 10) / 10,
    currentWeight: Math.round(currentWeight * 10) / 10,
    minWeight: Math.round(minWeight * 10) / 10,
    maxWeight: Math.round(maxWeight * 10) / 10,
    avgWeight: Math.round(avgWeight * 10) / 10,
    totalChange: Math.round(totalChange * 10) / 10,
    weeklyChange: Math.round(weeklyChange * 10) / 10,
    entriesCount: history.length,
    trend: totalChange < 0 ? 'losing' : totalChange > 0 ? 'gaining' : 'maintaining'
  };
};

/**
 * Get weight data formatted for charts
 * @param {ObjectId} userId - User ID
 * @param {number} days - Number of days
 * @returns {Promise<Object>} Chart-ready data
 */
weightLogSchema.statics.getChartData = async function(userId, days = 30) {
  const history = await this.getHistory(userId, days);
  
  return {
    labels: history.map(entry => entry.date.toISOString().split('T')[0]),
    datasets: [{
      label: 'Weight (kg)',
      data: history.map(entry => entry.weight),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };
};

const WeightLog = mongoose.model('WeightLog', weightLogSchema);

module.exports = WeightLog;
