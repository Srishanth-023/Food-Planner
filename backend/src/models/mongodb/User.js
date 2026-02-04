/**
 * User Model (MongoDB)
 * 
 * Stores user account information, profile data,
 * preferences, and authentication details.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't return password by default
  },
  
  // Profile information
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    avatar: {
      type: String,
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      default: 'prefer_not_to_say'
    }
  },

  // Physical attributes for calculations
  physicalAttributes: {
    height: {
      type: Number, // in cm
      min: [50, 'Height must be at least 50cm'],
      max: [300, 'Height cannot exceed 300cm']
    },
    weight: {
      type: Number, // in kg
      min: [20, 'Weight must be at least 20kg'],
      max: [500, 'Weight cannot exceed 500kg']
    },
    age: {
      type: Number,
      min: [13, 'Must be at least 13 years old'],
      max: [120, 'Age cannot exceed 120 years']
    }
  },

  // Fitness goals and preferences
  fitnessGoals: {
    primaryGoal: {
      type: String,
      enum: ['fat_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_fitness'],
      default: 'general_fitness'
    },
    targetWeight: {
      type: Number,
      min: [20, 'Target weight must be at least 20kg'],
      max: [500, 'Target weight cannot exceed 500kg']
    },
    weeklyGoal: {
      type: Number, // kg per week (positive for gain, negative for loss)
      min: [-1, 'Cannot lose more than 1kg per week safely'],
      max: [0.5, 'Cannot gain more than 0.5kg per week safely']
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      default: 'moderately_active'
    }
  },

  // Dietary preferences
  dietaryPreferences: {
    dietType: {
      type: String,
      enum: ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'],
      default: 'omnivore'
    },
    allergies: [{
      type: String,
      enum: ['gluten', 'dairy', 'nuts', 'shellfish', 'eggs', 'soy', 'fish', 'wheat']
    }],
    intolerances: [{
      type: String
    }],
    dislikedFoods: [{
      type: String
    }],
    preferredCuisines: [{
      type: String
    }]
  },

  // Calculated values (updated when profile changes)
  calculatedMetrics: {
    bmr: {
      type: Number, // Basal Metabolic Rate
      default: null
    },
    tdee: {
      type: Number, // Total Daily Energy Expenditure
      default: null
    },
    dailyCalorieTarget: {
      type: Number,
      default: null
    },
    macroTargets: {
      protein: { type: Number, default: null }, // grams
      carbs: { type: Number, default: null },   // grams
      fat: { type: Number, default: null }      // grams
    }
  },

  // Refresh tokens for JWT authentication
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }],

  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Timestamps
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// Indexes
// ===========================================

userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// ===========================================
// Virtual Properties
// ===========================================

// Get user's full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || 'User';
});

// Calculate age from date of birth
userSchema.virtual('calculatedAge').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// ===========================================
// Pre-save Middleware
// ===========================================

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Calculate BMR, TDEE, and targets before saving
userSchema.pre('save', function(next) {
  // Only recalculate if relevant fields changed
  const relevantFields = [
    'physicalAttributes.weight',
    'physicalAttributes.height',
    'physicalAttributes.age',
    'profile.gender',
    'fitnessGoals.activityLevel',
    'fitnessGoals.primaryGoal'
  ];
  
  const shouldRecalculate = relevantFields.some(field => this.isModified(field));
  
  if (shouldRecalculate || this.isNew) {
    this.calculateMetrics();
  }
  
  next();
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Compare password with hashed password
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * @returns {number} BMR in calories
 */
userSchema.methods.calculateBMR = function() {
  const { weight, height, age } = this.physicalAttributes;
  const gender = this.profile.gender;
  
  if (!weight || !height || !age) return null;
  
  // Mifflin-St Jeor Equation
  // Male: BMR = 10W + 6.25H - 5A + 5
  // Female: BMR = 10W + 6.25H - 5A - 161
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  
  if (gender === 'male') {
    bmr += 5;
  } else if (gender === 'female') {
    bmr -= 161;
  } else {
    // For other/prefer_not_to_say, use average
    bmr -= 78;
  }
  
  return Math.round(bmr);
};

/**
 * Calculate TDEE based on activity level
 * @returns {number} TDEE in calories
 */
userSchema.methods.calculateTDEE = function() {
  const bmr = this.calculateBMR();
  if (!bmr) return null;
  
  const activityMultipliers = {
    sedentary: 1.2,        // Little or no exercise
    lightly_active: 1.375, // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725,    // Hard exercise 6-7 days/week
    extra_active: 1.9      // Very hard exercise, physical job
  };
  
  const multiplier = activityMultipliers[this.fitnessGoals.activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate daily calorie target based on goal
 * @returns {number} Daily calorie target
 */
userSchema.methods.calculateDailyCalorieTarget = function() {
  const tdee = this.calculateTDEE();
  if (!tdee) return null;
  
  const goalAdjustments = {
    fat_loss: -500,      // 500 calorie deficit for ~0.5kg/week loss
    muscle_gain: 300,    // 300 calorie surplus for lean gains
    maintenance: 0,
    endurance: 200,      // Slight surplus for endurance training
    general_fitness: 0
  };
  
  const adjustment = goalAdjustments[this.fitnessGoals.primaryGoal] || 0;
  return Math.max(1200, tdee + adjustment); // Never go below 1200 calories
};

/**
 * Calculate macro targets based on goal
 * @returns {Object} Macro targets in grams
 */
userSchema.methods.calculateMacroTargets = function() {
  const calories = this.calculateDailyCalorieTarget();
  if (!calories) return null;
  
  // Macro splits based on goal (protein%, carbs%, fat%)
  const macroSplits = {
    fat_loss: { protein: 0.40, carbs: 0.30, fat: 0.30 },
    muscle_gain: { protein: 0.35, carbs: 0.45, fat: 0.20 },
    maintenance: { protein: 0.30, carbs: 0.40, fat: 0.30 },
    endurance: { protein: 0.20, carbs: 0.55, fat: 0.25 },
    general_fitness: { protein: 0.30, carbs: 0.40, fat: 0.30 }
  };
  
  const split = macroSplits[this.fitnessGoals.primaryGoal] || macroSplits.general_fitness;
  
  return {
    protein: Math.round((calories * split.protein) / 4), // 4 cal per gram
    carbs: Math.round((calories * split.carbs) / 4),     // 4 cal per gram
    fat: Math.round((calories * split.fat) / 9)          // 9 cal per gram
  };
};

/**
 * Calculate and update all metrics
 */
userSchema.methods.calculateMetrics = function() {
  this.calculatedMetrics.bmr = this.calculateBMR();
  this.calculatedMetrics.tdee = this.calculateTDEE();
  this.calculatedMetrics.dailyCalorieTarget = this.calculateDailyCalorieTarget();
  this.calculatedMetrics.macroTargets = this.calculateMacroTargets();
};

// ===========================================
// Static Methods
// ===========================================

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<User>}
 */
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

/**
 * Find user by credentials (for login)
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<User|null>}
 */
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ email: email.toLowerCase() }).select('+password');
  
  if (!user) return null;
  
  const isMatch = await user.comparePassword(password);
  return isMatch ? user : null;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
