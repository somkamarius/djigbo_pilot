require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { bedrockChatHandler } = require('./bedrockChatHandler');
const { ollamaChatHandler } = require('./ollamaChatHandler');
const { togetherChatHandler } = require('./togetherChatHandler');
const { checkJwt, auth0ErrorHandler, extractUserInfo, debugToken } = require('./auth0Middleware');

const {
  getUserConversationSummaries,
  getConversationSummary,
  deleteConversationSummary,
  getUserConversationCount,
  getConversationStats,
  generateConversationSummaryV2,
  generateConversationId,
  saveFeedback,
  getUserFeedback,
  getAllFeedback,
  getFeedbackStats,
  getUserByAuth0Id,
  createUser,
  updateUser,
  validateBase64Image,
  saveMoodEntry,
  getUserMoodEntries,
  getUserMoodStats,
  getCampMoodData,
  getTodayCampMood,
  getOverallCampMoodStats,
  getAllParticipantsMoodEntries,
  getParticipantsMoodByDate
} = require('./database');

// At the top of server.js
const logger = require('./logger');

// Async error wrapper function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const app = express();
app.use(cors());
app.use(express.json());

// Auth0 error handler middleware (must be before other error handlers)
app.use(auth0ErrorHandler);

// Error boundary middleware for synchronous errors
app.use((err, req, res, next) => {
  logger.error('Unhandled synchronous error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    reason: reason,
    promise: promise,
    stack: reason instanceof Error ? reason.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Gracefully shutdown the server
  process.exit(1);
});

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Health check endpoint for DigitalOcean App Platform
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Kibana endpoint - shows status since Kibana is not available on DigitalOcean App Platform
app.get('/kibana', (req, res) => {
  res.status(503).json({
    error: 'Kibana service unavailable',
    message: 'Kibana is not running on DigitalOcean App Platform. To access Kibana, you need to run it separately or use a different deployment strategy.',
    timestamp: new Date().toISOString(),
    suggestions: [
      'Run Kibana locally with docker-compose up',
      'Deploy to a platform that supports multi-service deployments (like DigitalOcean Droplets with Docker)',
      'Use a managed ELK stack service'
    ]
  });
});

// USAGE:
// POST /api/chat
// Body: {
//   "messages": [
//     {"role": "system", "content": "You are a helpful assistant."},
//     {"role": "user", "content": "Hello!"},
//     {"role": "assistant", "content": "Hi! How can I help you?"}
//   ],
//   "max_tokens": 1024 // optional
// }
// To set a system prompt, include a message with role "system" as the first message.
//
// The response will be the assistant's reply from the LLM.
// Protected routes - require authentication
app.post('/api/chat', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    await bedrockChatHandler(req, res);
  } catch (error) {
    logger.error('Error in /api/chat endpoint:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error; // Re-throw to be caught by error middleware
  }
}));

app.get('/status', asyncHandler(async (req, res) => {
  try {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      auth: {
        enabled: true,
        provider: 'Auth0'
      }
    });
  } catch (error) {
    logger.error('Error in /status endpoint:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get user profile (requires authentication)
app.get('/api/profile', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    res.json({
      user: req.user,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/profile endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Add a new endpoint for Ollama
app.post('/api/ollama-chat', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    await ollamaChatHandler(req, res);
  } catch (error) {
    logger.error('Error in /api/ollama-chat endpoint:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Add a new endpoint for Together.ai
app.post('/api/together-chat', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    await togetherChatHandler(req, res);
  } catch (error) {
    logger.error('Error in /api/together-chat endpoint:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Mock chat endpoint that returns a fixed response
app.post('/api/chat-mock', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const { conversation_id } = req.body;
    const convId = conversation_id || generateConversationId();
    console.log({
      content: "This is a mock response from the chat-mock endpoint. Hello from the mock server!",
      conversation_id: convId,
      messages: req.body.messages,
    })
    logger.info(JSON.stringify({
      content: "This is a mock response from the chat-mock endpoint. Hello from the mock server!",
      conversation_id: convId,
      messages: req.body.messages,
    }));
    res.json({
      content: "This is a mock response from the chat-mock endpoint. Hello from the mock server!",
      conversation_id: convId,
    });
  } catch (error) {
    logger.error('Error in /api/chat-mock endpoint:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get all conversation summaries for the authenticated user
app.get('/api/conversations', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const summaries = await getUserConversationSummaries(userId);
    res.json({
      conversations: summaries,
      count: summaries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/conversations endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get a specific conversation summary
app.get('/api/conversations/:conversationId', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const { conversationId } = req.params;
    const summary = await getConversationSummary(userId, conversationId);

    if (!summary) {
      return res.status(404).json({
        error: 'Conversation not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      conversation: summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/conversations/:conversationId endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      conversationId: req.params.conversationId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Delete a conversation summary
app.delete('/api/conversations/:conversationId', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const { conversationId } = req.params;
    const deletedCount = await deleteConversationSummary(userId, conversationId);

    if (deletedCount === 0) {
      return res.status(404).json({
        error: 'Conversation not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'Conversation deleted successfully',
      deletedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in DELETE /api/conversations/:conversationId endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      conversationId: req.params.conversationId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get user conversation count
app.get('/api/conversations/count', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const count = await getUserConversationCount(userId);
    res.json({
      count,
      userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/conversations/count endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get conversation statistics (admin endpoint - could add admin check later)
app.get('/api/conversations/stats', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const stats = await getConversationStats();
    res.json({
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/conversations/stats endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Test summary generation endpoint
app.post('/api/test-summary', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const { messages, assistant_response, provider = 'simple' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'messages array is required',
        timestamp: new Date().toISOString()
      });
    }

    if (!assistant_response) {
      return res.status(400).json({
        error: 'assistant_response is required',
        timestamp: new Date().toISOString()
      });
    }

    const summary = await generateConversationSummaryV2(messages, assistant_response, provider);

    res.json({
      summary,
      provider,
      message_count: messages.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/test-summary endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Submit feedback endpoint
app.post('/api/feedback', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const { feedbackText } = req.body;

    if (!feedbackText || typeof feedbackText !== 'string' || feedbackText.trim() === '') {
      return res.status(400).json({
        error: 'feedbackText is required and must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    const userId = req.user.sub;
    const feedbackId = await saveFeedback(userId, feedbackText.trim());

    res.json({
      message: 'Feedback submitted successfully',
      feedbackId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in /api/feedback endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get user's feedback endpoint
app.get('/api/feedback', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const feedback = await getUserFeedback(userId);

    res.json({
      feedback,
      count: feedback.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/feedback endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get all feedback (admin endpoint)
app.get('/api/feedback/all', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const feedback = await getAllFeedback();

    res.json({
      feedback,
      count: feedback.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/feedback/all endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get feedback statistics endpoint
app.get('/api/feedback/stats', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const stats = await getFeedbackStats();

    res.json({
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/feedback/stats endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Check if user exists endpoint
app.get('/api/user/check', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await getUserByAuth0Id(userId);

    res.json({
      exists: !!user,
      user: user || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/user/check endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Register new user endpoint
app.post('/api/user/register', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const { nickname, avatar } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return res.status(400).json({
        error: 'nickname is required and must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    // Validate avatar data if provided
    if (avatar && typeof avatar === 'string') {
      const validation = validateBase64Image(avatar);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Check if user already exists
    const existingUser = await getUserByAuth0Id(userId);
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        timestamp: new Date().toISOString()
      });
    }

    // Create new user
    const newUserId = await createUser(userId, nickname.trim(), avatar || null);

    res.json({
      message: 'User registered successfully',
      userId: newUserId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/user/register endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get user avatar endpoint
app.get('/api/user/avatar/:userId', asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
        timestamp: new Date().toISOString()
      });
    }

    const user = await getUserByAuth0Id(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    if (!user.avatar) {
      return res.status(404).json({
        error: 'User has no avatar',
        timestamp: new Date().toISOString()
      });
    }

    // Check if it's a base64 data URL
    if (user.avatar.startsWith('data:image/')) {
      // Extract content type and base64 data
      const matches = user.avatar.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const contentType = matches[1];
        const base64Data = matches[2];

        // Set appropriate headers
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        // Send the base64 data as buffer
        const buffer = Buffer.from(base64Data, 'base64');
        res.send(buffer);
        return;
      }
    }

    // If it's a URL, redirect to it
    res.redirect(user.avatar);
  } catch (error) {
    logger.error('Error in GET /api/user/avatar/:userId endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Update user endpoint
app.put('/api/user/update', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const { nickname, avatar } = req.body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim() === '') {
      return res.status(400).json({
        error: 'nickname is required and must be a non-empty string',
        timestamp: new Date().toISOString()
      });
    }

    // Validate avatar data if provided
    if (avatar && typeof avatar === 'string') {
      const validation = validateBase64Image(avatar);
      if (!validation.valid) {
        return res.status(400).json({
          error: validation.error,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Check if user exists
    const existingUser = await getUserByAuth0Id(userId);
    if (!existingUser) {
      return res.status(404).json({
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }

    // Update user
    const updatedCount = await updateUser(userId, nickname.trim(), avatar || null);

    res.json({
      message: 'User updated successfully',
      updatedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in PUT /api/user/update endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Save mood entry endpoint
app.post('/api/mood', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const { moodScore, thoughts } = req.body;

    if (!moodScore || typeof moodScore !== 'number' || moodScore < 1 || moodScore > 5) {
      return res.status(400).json({
        error: 'moodScore is required and must be a number between 1 and 5',
        timestamp: new Date().toISOString()
      });
    }

    // Save mood entry
    const moodId = await saveMoodEntry(userId, moodScore, thoughts || null);

    res.json({
      message: 'Mood entry saved successfully',
      moodId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in POST /api/mood endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get user's mood entries endpoint
app.get('/api/mood/personal', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const userId = req.user.sub;
    const limit = parseInt(req.query.limit) || 30;

    const moodEntries = await getUserMoodEntries(userId, limit);
    const moodStats = await getUserMoodStats(userId);

    res.json({
      entries: moodEntries,
      stats: moodStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/mood/personal endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get camp-wide mood data endpoint
app.get('/api/mood/camp', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const campMoodData = await getCampMoodData(startDate || null, endDate || null);
    const todayMood = await getTodayCampMood();
    const overallStats = await getOverallCampMoodStats();

    res.json({
      campData: campMoodData,
      today: todayMood,
      overall: overallStats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/mood/camp endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

// Get participants feedback endpoint
app.get('/api/mood/participants', debugToken, checkJwt, extractUserInfo, asyncHandler(async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const participantsData = await getParticipantsMoodByDate(startDate || null, endDate || null);
    const allParticipants = await getAllParticipantsMoodEntries(startDate || null, endDate || null);

    res.json({
      participantsByDate: participantsData,
      allParticipants: allParticipants,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in GET /api/mood/participants endpoint:', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.sub,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}));

logger.info('Server started v2');

