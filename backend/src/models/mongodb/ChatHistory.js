/**
 * Chat History Model (MongoDB)
 * 
 * Stores conversation history with the GenAI assistant
 * for context-aware responses and user reference.
 */

const mongoose = require('mongoose');

// Schema for individual messages
const messageSchema = new mongoose.Schema({
  // Message role
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  
  // Message content
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  
  // Message metadata
  metadata: {
    // Tokens used (for tracking API usage)
    tokensUsed: {
      type: Number,
      default: 0
    },
    // Model used for response
    model: {
      type: String,
      default: null
    },
    // Response time in ms
    responseTime: {
      type: Number,
      default: null
    },
    // If message contains meal plan
    containsMealPlan: {
      type: Boolean,
      default: false
    },
    // If message contains workout plan
    containsWorkoutPlan: {
      type: Boolean,
      default: false
    },
    // Referenced foods
    referencedFoods: [{
      type: String
    }]
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Main chat history schema
const chatHistorySchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  // Conversation title (auto-generated or user-defined)
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 200
  },
  
  // Messages in this conversation
  messages: [messageSchema],
  
  // Conversation context (for maintaining context across messages)
  context: {
    // User's current fitness goal context
    fitnessGoal: {
      type: String,
      default: null
    },
    // User's dietary preferences for this conversation
    dietaryPreferences: {
      type: String,
      default: null
    },
    // Any specific topics being discussed
    topics: [{
      type: String
    }],
    // Custom system prompt if any
    customSystemPrompt: {
      type: String,
      default: null
    }
  },
  
  // Conversation statistics
  stats: {
    messageCount: {
      type: Number,
      default: 0
    },
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    userMessages: {
      type: Number,
      default: 0
    },
    assistantMessages: {
      type: Number,
      default: 0
    }
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Archived conversations
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Last activity timestamp
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===========================================
// Indexes
// ===========================================

chatHistorySchema.index({ userId: 1, lastActivity: -1 });
chatHistorySchema.index({ userId: 1, isArchived: 1 });
chatHistorySchema.index({ userId: 1, createdAt: -1 });

// ===========================================
// Pre-save Middleware
// ===========================================

// Update stats before saving
chatHistorySchema.pre('save', function(next) {
  if (this.messages) {
    this.stats.messageCount = this.messages.length;
    this.stats.userMessages = this.messages.filter(m => m.role === 'user').length;
    this.stats.assistantMessages = this.messages.filter(m => m.role === 'assistant').length;
    this.stats.totalTokensUsed = this.messages.reduce((sum, m) => sum + (m.metadata.tokensUsed || 0), 0);
    this.lastActivity = new Date();
  }
  next();
});

// ===========================================
// Instance Methods
// ===========================================

/**
 * Add a new message to the conversation
 * @param {string} role - Message role (user/assistant/system)
 * @param {string} content - Message content
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<ChatHistory>} Updated chat history
 */
chatHistorySchema.methods.addMessage = async function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata,
    timestamp: new Date()
  });
  
  // Auto-generate title from first user message
  if (this.title === 'New Conversation' && role === 'user') {
    this.title = content.substring(0, 50) + (content.length > 50 ? '...' : '');
  }
  
  return this.save();
};

/**
 * Get recent messages for context
 * @param {number} count - Number of recent messages to get
 * @returns {Array} Recent messages
 */
chatHistorySchema.methods.getRecentMessages = function(count = 10) {
  return this.messages.slice(-count);
};

/**
 * Format messages for OpenAI API
 * @param {number} maxMessages - Maximum messages to include
 * @returns {Array} Formatted messages for API
 */
chatHistorySchema.methods.formatForAPI = function(maxMessages = 20) {
  const messages = [];
  
  // Add system context if available
  if (this.context.customSystemPrompt) {
    messages.push({
      role: 'system',
      content: this.context.customSystemPrompt
    });
  }
  
  // Add recent conversation messages
  const recentMessages = this.messages.slice(-maxMessages);
  recentMessages.forEach(msg => {
    messages.push({
      role: msg.role,
      content: msg.content
    });
  });
  
  return messages;
};

// ===========================================
// Static Methods
// ===========================================

/**
 * Get active conversations for a user
 * @param {ObjectId} userId - User ID
 * @param {number} limit - Maximum conversations to return
 * @returns {Promise<Array>} Active conversations
 */
chatHistorySchema.statics.getActiveConversations = function(userId, limit = 20) {
  return this.find({
    userId,
    isArchived: false
  })
  .sort({ lastActivity: -1 })
  .limit(limit)
  .select('title stats.messageCount lastActivity createdAt');
};

/**
 * Create or get today's conversation
 * @param {ObjectId} userId - User ID
 * @returns {Promise<ChatHistory>} Today's conversation
 */
chatHistorySchema.statics.getOrCreateToday = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let conversation = await this.findOne({
    userId,
    createdAt: { $gte: today },
    isArchived: false
  }).sort({ createdAt: -1 });
  
  if (!conversation) {
    conversation = new this({
      userId,
      title: `Conversation - ${today.toLocaleDateString()}`
    });
    await conversation.save();
  }
  
  return conversation;
};

/**
 * Search conversations by content
 * @param {ObjectId} userId - User ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching conversations
 */
chatHistorySchema.statics.searchConversations = function(userId, query) {
  return this.find({
    userId,
    $text: { $search: query }
  })
  .sort({ score: { $meta: 'textScore' } })
  .limit(20);
};

// Text index for search
chatHistorySchema.index({ 'messages.content': 'text', title: 'text' });

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);

module.exports = ChatHistory;
