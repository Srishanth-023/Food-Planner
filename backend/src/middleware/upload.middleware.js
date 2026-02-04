/**
 * File Upload Middleware
 * 
 * Handles file uploads using Multer with validation
 * for food images and profile pictures.
 */

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { APIError } = require('./errorHandler');

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// File size limit (10MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;

/**
 * Storage configuration for food images
 */
const foodImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/food-images');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

/**
 * Storage configuration for profile pictures
 */
const profilePictureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

/**
 * Memory storage for AI processing
 * Stores file in buffer for direct processing
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter function
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new APIError(
      `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      400,
      'INVALID_FILE_TYPE'
    ), false);
  }
};

/**
 * Food image upload middleware (saves to disk)
 */
const uploadFoodImage = multer({
  storage: foodImageStorage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
}).single('image');

/**
 * Food image upload middleware (memory for AI processing)
 */
const uploadFoodImageToMemory = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter
}).single('image');

/**
 * Profile picture upload middleware
 */
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for profile pictures
  },
  fileFilter
}).single('avatar');

/**
 * Multiple food images upload
 */
const uploadMultipleFoodImages = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5
  },
  fileFilter
}).array('images', 5);

/**
 * Wrapper to handle multer errors
 */
const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          let message = 'File upload error';
          if (err.code === 'LIMIT_FILE_SIZE') {
            message = `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
          } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files. Maximum is 5 files.';
          }
          return res.status(400).json({
            success: false,
            message,
            code: err.code
          });
        }
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadFoodImage: handleUpload(uploadFoodImage),
  uploadFoodImageToMemory: handleUpload(uploadFoodImageToMemory),
  uploadProfilePicture: handleUpload(uploadProfilePicture),
  uploadMultipleFoodImages: handleUpload(uploadMultipleFoodImages)
};
