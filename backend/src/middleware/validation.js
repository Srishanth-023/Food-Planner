/**
 * Validation Schemas
 * 
 * Joi validation schemas for request validation
 */

const Joi = require('joi');

// ===========================================
// Auth Schemas
// ===========================================

const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  firstName: Joi.string()
    .max(50)
    .optional(),
  lastName: Joi.string()
    .max(50)
    .optional()
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'any.required': 'Refresh token is required'
    })
});

// ===========================================
// User Profile Schemas
// ===========================================

const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(50).optional(),
  lastName: Joi.string().max(50).optional(),
  dateOfBirth: Joi.date().max('now').optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer_not_to_say').optional()
});

const updatePhysicalAttributesSchema = Joi.object({
  height: Joi.number().min(50).max(300).required()
    .messages({
      'number.min': 'Height must be at least 50cm',
      'number.max': 'Height cannot exceed 300cm'
    }),
  weight: Joi.number().min(20).max(500).required()
    .messages({
      'number.min': 'Weight must be at least 20kg',
      'number.max': 'Weight cannot exceed 500kg'
    }),
  age: Joi.number().integer().min(13).max(120).required()
    .messages({
      'number.min': 'Must be at least 13 years old',
      'number.max': 'Age cannot exceed 120 years'
    })
});

const updateFitnessGoalsSchema = Joi.object({
  primaryGoal: Joi.string()
    .valid('fat_loss', 'muscle_gain', 'maintenance', 'endurance', 'general_fitness')
    .required(),
  targetWeight: Joi.number().min(20).max(500).optional(),
  weeklyGoal: Joi.number().min(-1).max(0.5).optional(),
  activityLevel: Joi.string()
    .valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active')
    .required()
});

const updateDietaryPreferencesSchema = Joi.object({
  dietType: Joi.string()
    .valid('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo')
    .required(),
  allergies: Joi.array()
    .items(Joi.string().valid('gluten', 'dairy', 'nuts', 'shellfish', 'eggs', 'soy', 'fish', 'wheat'))
    .optional(),
  intolerances: Joi.array().items(Joi.string()).optional(),
  dislikedFoods: Joi.array().items(Joi.string()).optional(),
  preferredCuisines: Joi.array().items(Joi.string()).optional()
});

// ===========================================
// Food Log Schemas
// ===========================================

const createFoodLogSchema = Joi.object({
  date: Joi.date().default(Date.now),
  mealType: Joi.string()
    .valid('breakfast', 'lunch', 'dinner', 'snack', 'other')
    .required(),
  mealTime: Joi.date().optional(),
  foods: Joi.array().items(
    Joi.object({
      foodName: Joi.string().required(),
      portion: Joi.object({
        amount: Joi.number().min(0).required(),
        unit: Joi.string().valid('g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece', 'serving').default('g'),
        servingSize: Joi.number().default(100)
      }).required(),
      nutrition: Joi.object({
        calories: Joi.number().min(0).required(),
        protein: Joi.number().min(0).default(0),
        carbohydrates: Joi.number().min(0).default(0),
        fat: Joi.number().min(0).default(0),
        fiber: Joi.number().min(0).default(0),
        sugar: Joi.number().min(0).default(0),
        sodium: Joi.number().min(0).default(0)
      }).required(),
      notes: Joi.string().max(500).optional()
    })
  ).min(1).required(),
  notes: Joi.string().max(1000).optional()
});

// ===========================================
// Weight Log Schemas
// ===========================================

const createWeightLogSchema = Joi.object({
  weight: Joi.number()
    .min(20)
    .max(500)
    .required()
    .messages({
      'number.min': 'Weight must be at least 20kg',
      'number.max': 'Weight cannot exceed 500kg'
    }),
  unit: Joi.string().valid('kg', 'lbs').default('kg'),
  date: Joi.date().default(Date.now),
  timeOfDay: Joi.string()
    .valid('morning', 'afternoon', 'evening', 'not_specified')
    .default('morning'),
  measurements: Joi.object({
    bodyFatPercentage: Joi.number().min(1).max(60).optional(),
    muscleMass: Joi.number().min(0).optional(),
    waterPercentage: Joi.number().min(0).max(100).optional(),
    waistCircumference: Joi.number().min(0).optional(),
    hipCircumference: Joi.number().min(0).optional()
  }).optional(),
  notes: Joi.string().max(500).optional()
});

// ===========================================
// Chat Schemas
// ===========================================

const chatMessageSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 2000 characters'
    }),
  conversationId: Joi.string().optional()
});

// ===========================================
// Plan Generation Schemas
// ===========================================

const generateMealPlanSchema = Joi.object({
  days: Joi.number().integer().min(1).max(7).default(7),
  includeSnacks: Joi.boolean().default(true),
  preferences: Joi.object({
    dietType: Joi.string().valid('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo').optional(),
    excludeFoods: Joi.array().items(Joi.string()).optional(),
    preferredCuisines: Joi.array().items(Joi.string()).optional()
  }).optional()
});

const generateWorkoutPlanSchema = Joi.object({
  days: Joi.number().integer().min(1).max(7).default(7),
  preferences: Joi.object({
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    includeRestDays: Joi.boolean().default(true),
    availableEquipment: Joi.array().items(Joi.string()).optional(),
    maxDuration: Joi.number().min(15).max(120).optional()
  }).optional()
});

// ===========================================
// Validation Middleware Factory
// ===========================================

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

module.exports = {
  // Auth
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  
  // User
  updateProfileSchema,
  updatePhysicalAttributesSchema,
  updateFitnessGoalsSchema,
  updateDietaryPreferencesSchema,
  
  // Food & Weight
  createFoodLogSchema,
  createWeightLogSchema,
  
  // Chat
  chatMessageSchema,
  
  // Plans
  generateMealPlanSchema,
  generateWorkoutPlanSchema,
  
  // Middleware
  validate
};
