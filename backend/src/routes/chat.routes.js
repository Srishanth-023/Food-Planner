/**
 * Chat Routes
 * 
 * Handles GenAI assistant conversations,
 * chat history, and natural language queries.
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ChatHistory } = require('../models/mongodb');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, chatMessageSchema } = require('../middleware/validation');
const logger = require('../utils/logger');
const { APIError } = require('../middleware/errorHandler');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route   POST /api/v1/chat/message
 * @desc    Send a message to the GenAI assistant
 * @access  Private
 */
router.post('/message', authenticate, validate(chatMessageSchema), async (req, res, next) => {
  try {
    const { message, conversationId } = req.validatedBody;

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await ChatHistory.findOne({
        _id: conversationId,
        userId: req.userId
      });
      
      if (!conversation) {
        throw new APIError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
      }
    } else {
      conversation = await ChatHistory.getOrCreateToday(req.userId);
    }

    // Add user message to history
    await conversation.addMessage('user', message);

    // Prepare context for AI
    const userContext = {
      profile: req.user.profile,
      physicalAttributes: req.user.physicalAttributes,
      fitnessGoals: req.user.fitnessGoals,
      dietaryPreferences: req.user.dietaryPreferences,
      calculatedMetrics: req.user.calculatedMetrics
    };

    // Get recent conversation history for context
    const conversationHistory = conversation.formatForAPI(10);

    // Send to AI service
    const startTime = Date.now();
    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/v1/chat`,
      {
        message,
        conversation_history: conversationHistory,
        user_context: userContext
      },
      {
        timeout: 30000
      }
    );
    const responseTime = Date.now() - startTime;

    const assistantMessage = aiResponse.data.response;
    const metadata = {
      model: aiResponse.data.model || 'unknown',
      tokensUsed: aiResponse.data.tokens_used || 0,
      responseTime,
      containsMealPlan: assistantMessage.toLowerCase().includes('meal plan'),
      containsWorkoutPlan: assistantMessage.toLowerCase().includes('workout')
    };

    // Add assistant response to history
    await conversation.addMessage('assistant', assistantMessage, metadata);

    logger.info(`Chat message processed for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        conversationId: conversation._id,
        response: assistantMessage,
        metadata: {
          model: metadata.model,
          responseTime: metadata.responseTime
        }
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return next(new APIError('AI service unavailable', 503, 'AI_SERVICE_UNAVAILABLE'));
    }
    next(error);
  }
});

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get list of user's conversations
 * @access  Private
 */
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const { limit = 20, includeArchived = false } = req.query;

    let query = { userId: req.userId };
    if (!includeArchived) {
      query.isArchived = false;
    }

    const conversations = await ChatHistory.find(query)
      .sort({ lastActivity: -1 })
      .limit(parseInt(limit))
      .select('title stats lastActivity createdAt isArchived');

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/chat/conversations/:id
 * @desc    Get specific conversation with messages
 * @access  Private
 */
router.get('/conversations/:id', authenticate, async (req, res, next) => {
  try {
    const conversation = await ChatHistory.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!conversation) {
      throw new APIError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/chat/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post('/conversations', authenticate, async (req, res, next) => {
  try {
    const { title } = req.body;

    const conversation = new ChatHistory({
      userId: req.userId,
      title: title || 'New Conversation'
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/v1/chat/conversations/:id
 * @desc    Update conversation (title, archive status)
 * @access  Private
 */
router.put('/conversations/:id', authenticate, async (req, res, next) => {
  try {
    const { title, isArchived } = req.body;

    const conversation = await ChatHistory.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        ...(title && { title }),
        ...(isArchived !== undefined && { isArchived })
      },
      { new: true }
    );

    if (!conversation) {
      throw new APIError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: { conversation }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/v1/chat/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/conversations/:id', authenticate, async (req, res, next) => {
  try {
    const conversation = await ChatHistory.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!conversation) {
      throw new APIError('Conversation not found', 404, 'CONVERSATION_NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/chat/search
 * @desc    Search through chat history
 * @access  Private
 */
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 3) {
      return res.json({
        success: true,
        data: { conversations: [] }
      });
    }

    const conversations = await ChatHistory.searchConversations(req.userId, query);

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/chat/quick-query
 * @desc    Quick one-off query without saving to history
 * @access  Private
 */
router.post('/quick-query', authenticate, async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query) {
      throw new APIError('Query is required', 400, 'MISSING_QUERY');
    }

    // Simple context for quick queries
    const userContext = {
      dietaryPreferences: req.user.dietaryPreferences,
      fitnessGoals: req.user.fitnessGoals,
      calculatedMetrics: req.user.calculatedMetrics
    };

    const aiResponse = await axios.post(
      `${AI_SERVICE_URL}/api/v1/quick-query`,
      {
        query,
        user_context: userContext
      },
      {
        timeout: 15000
      }
    );

    res.json({
      success: true,
      data: {
        response: aiResponse.data.response
      }
    });
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return next(new APIError('AI service unavailable', 503, 'AI_SERVICE_UNAVAILABLE'));
    }
    next(error);
  }
});

module.exports = router;
