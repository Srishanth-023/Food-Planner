/**
 * MongoDB Models Index
 * 
 * Exports all MongoDB models for easy importing
 */

const User = require('./User');
const FoodLog = require('./FoodLog');
const WeightLog = require('./WeightLog');
const ChatHistory = require('./ChatHistory');

module.exports = {
  User,
  FoodLog,
  WeightLog,
  ChatHistory
};
