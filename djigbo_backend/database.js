const { Pool } = require('pg');
const logger = require('./logger');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fetch = require('node-fetch');
require('dotenv').config();

// PostgreSQL connection configuration
const getSSLConfig = () => {
    // For DigitalOcean and other cloud providers that require SSL with self-signed certs
    if (process.env.DB_HOST && process.env.DB_HOST.includes('digitalocean.com')) {
        return {
            rejectUnauthorized: false,
            sslmode: 'require'
        };
    }

    // If DATABASE_URL contains SSL parameters, use them
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=')) {
        return undefined; // Let the connection string handle SSL
    }

    // For production environments, require SSL but allow self-signed certs
    if (process.env.NODE_ENV === 'production') {
        return {
            rejectUnauthorized: false,
            sslmode: 'require'
        };
    }

    // For development, disable SSL
    return false;
};

// Determine if we're using DigitalOcean
const isDigitalOcean = process.env.DB_HOST && process.env.DB_HOST.includes('digitalocean.com');

// For DigitalOcean, we need to handle SSL differently
if (isDigitalOcean) {
    // Force SSL configuration for DigitalOcean
    process.env.PGSSLMODE = 'require';
    // Also set Node.js to accept self-signed certificates
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Create connection configuration
let connectionConfig = {
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// If using DATABASE_URL, modify it for DigitalOcean
if (process.env.DATABASE_URL) {
    let connectionString = process.env.DATABASE_URL;
    if (isDigitalOcean) {
        // Remove any existing SSL parameters and add our own
        connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
        connectionString = connectionString.replace(/[?&]ssl=[^&]*/g, '');
        const separator = connectionString.includes('?') ? '&' : '?';
        connectionString += `${separator}sslmode=require&ssl=true`;
    }
    connectionConfig.connectionString = connectionString;
} else {
    // Use individual parameters
    connectionConfig = {
        ...connectionConfig,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'djigbo_db',
        user: process.env.DB_USER || 'username',
        password: process.env.DB_PASSWORD || 'password',
    };
}

// Add SSL configuration
if (isDigitalOcean) {
    connectionConfig.ssl = {
        rejectUnauthorized: false,
        sslmode: 'require'
    };
    logger.info('DigitalOcean SSL configuration applied:', connectionConfig.ssl);
} else {
    connectionConfig.ssl = getSSLConfig();
}

logger.info('Database connection configuration:', {
    isDigitalOcean,
    hasSSL: !!connectionConfig.ssl,
    sslConfig: connectionConfig.ssl,
    host: connectionConfig.host || 'from-connection-string'
});

const pool = new Pool(connectionConfig);

// Test database connection
pool.on('connect', () => {
    logger.info('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Initialize database tables immediately
initializeDatabase();

// Initialize database tables
async function initializeDatabase() {
    const createConversationTableSQL = `
    CREATE TABLE IF NOT EXISTS conversation_summaries (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, conversation_id)
    )
  `;

    const createFeedbackTableSQL = `
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      feedback_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

    const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      auth0_user_id TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

    const createMoodTableSQL = `
    CREATE TABLE IF NOT EXISTS mood_entries (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
      thoughts TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

    const createMoodStatsTableSQL = `
    CREATE TABLE IF NOT EXISTS mood_stats (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      avg_mood DECIMAL(3,2) NOT NULL,
      participant_count INTEGER NOT NULL,
      common_thoughts TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
    )
  `;

    try {
        // Create conversation summaries table
        await pool.query(createConversationTableSQL);
        logger.info('Conversation summaries table ready');

        // Create feedback table
        await pool.query(createFeedbackTableSQL);
        logger.info('Feedback table ready');

        // Create users table
        await pool.query(createUsersTableSQL);
        logger.info('Users table ready');

        // Create mood entries table
        await pool.query(createMoodTableSQL);
        logger.info('Mood entries table ready');

        // Create mood stats table
        await pool.query(createMoodStatsTableSQL);
        logger.info('Mood stats table ready');

        // Create indexes for better performance
        await pool.query('CREATE INDEX IF NOT EXISTS idx_conversation_summaries_user_id ON conversation_summaries(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conversation_id ON conversation_summaries(conversation_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_users_auth0_user_id ON users(auth0_user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_mood_stats_date ON mood_stats(date)');

        logger.info('Database initialization completed successfully');
    } catch (error) {
        logger.error('Error initializing database:', error);
        throw error;
    }
}

// Save conversation summary
async function saveConversationSummary(userId, conversationId, summary, messageCount = 0) {
    try {
        const sql = `
      INSERT INTO conversation_summaries 
      (user_id, conversation_id, summary, message_count, updated_at) 
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, conversation_id) 
      DO UPDATE SET 
        summary = EXCLUDED.summary,
        message_count = EXCLUDED.message_count,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

        const result = await pool.query(sql, [userId, conversationId, summary, messageCount]);
        logger.info(`Saved conversation summary for user ${userId}, conversation ${conversationId}`);
        return result.rows[0].id;
    } catch (error) {
        logger.error('Error saving conversation summary:', error);
        throw error;
    }
}

// Get conversation summary by user and conversation ID
async function getConversationSummary(userId, conversationId) {
    try {
        const sql = `
      SELECT * FROM conversation_summaries 
      WHERE user_id = $1 AND conversation_id = $2
    `;

        const result = await pool.query(sql, [userId, conversationId]);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Error getting conversation summary:', error);
        throw error;
    }
}

// Get all conversation summaries for a user
async function getUserConversationSummaries(userId) {
    try {
        const sql = `
      SELECT * FROM conversation_summaries 
      WHERE user_id = $1 
      ORDER BY updated_at DESC
    `;

        const result = await pool.query(sql, [userId]);
        return result.rows;
    } catch (error) {
        logger.error('Error getting user conversation summaries:', error);
        throw error;
    }
}

// Delete conversation summary
async function deleteConversationSummary(userId, conversationId) {
    try {
        const sql = `
      DELETE FROM conversation_summaries 
      WHERE user_id = $1 AND conversation_id = $2
    `;

        const result = await pool.query(sql, [userId, conversationId]);
        logger.info(`Deleted conversation summary for user ${userId}, conversation ${conversationId}`);
        return result.rowCount > 0;
    } catch (error) {
        logger.error('Error deleting conversation summary:', error);
        throw error;
    }
}

// Update conversation summary
async function updateConversationSummary(userId, conversationId, summary, messageCount) {
    try {
        const sql = `
      UPDATE conversation_summaries 
      SET summary = $3, message_count = $4, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND conversation_id = $2
      RETURNING id
    `;

        const result = await pool.query(sql, [userId, conversationId, summary, messageCount]);
        if (result.rowCount > 0) {
            logger.info(`Updated conversation summary for user ${userId}, conversation ${conversationId}`);
            return result.rows[0].id;
        } else {
            throw new Error('Conversation summary not found');
        }
    } catch (error) {
        logger.error('Error updating conversation summary:', error);
        throw error;
    }
}

// Get conversation count for a user
async function getUserConversationCount(userId) {
    try {
        const sql = `
      SELECT COUNT(*) as count FROM conversation_summaries 
      WHERE user_id = $1
    `;

        const result = await pool.query(sql, [userId]);
        return parseInt(result.rows[0].count);
    } catch (error) {
        logger.error('Error getting user conversation count:', error);
        throw error;
    }
}

// Delete old conversations
async function deleteOldConversations(daysOld = 30) {
    try {
        const sql = `
      DELETE FROM conversation_summaries 
      WHERE updated_at < CURRENT_TIMESTAMP - INTERVAL '${daysOld} days'
    `;

        const result = await pool.query(sql);
        logger.info(`Deleted ${result.rowCount} old conversations (older than ${daysOld} days)`);
        return result.rowCount;
    } catch (error) {
        logger.error('Error deleting old conversations:', error);
        throw error;
    }
}

// Get conversation statistics
async function getConversationStats() {
    try {
        const sql = `
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(message_count) as avg_messages_per_conversation,
        MAX(created_at) as latest_conversation
      FROM conversation_summaries
    `;

        const result = await pool.query(sql);
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting conversation stats:', error);
        throw error;
    }
}

// Generate conversation ID
function generateConversationId() {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate conversation summary using AI
async function generateConversationSummaryV2(messages, assistantResponse, provider = 'ollama') {
    try {
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        const messageCount = messages.length;

        let summary;
        switch (provider) {
            case 'bedrock':
                summary = await generateSummaryWithBedrock(lastUserMessage, assistantResponse);
                break;
            case 'ollama':
                summary = await generateSummaryWithOllama(lastUserMessage, assistantResponse);
                break;
            case 'together':
                summary = await generateSummaryWithTogether(lastUserMessage, assistantResponse);
                break;
            default:
                summary = generateSimpleSummary(messages, assistantResponse);
        }

        return {
            summary,
            messageCount,
            provider
        };
    } catch (error) {
        logger.error('Error generating conversation summary:', error);
        // Fallback to simple summary
        return {
            summary: generateSimpleSummary(messages, assistantResponse),
            messageCount: messages.length,
            provider: 'simple'
        };
    }
}

// Generate summary using AWS Bedrock
async function generateSummaryWithBedrock(lastUserMessage, assistantResponse) {
    const client = new BedrockRuntimeClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
    });

    const prompt = `Summarize this conversation in 2-3 sentences:

User: ${lastUserMessage}
Assistant: ${assistantResponse}

Summary:`;

    const command = new InvokeModelCommand({
        modelId: process.env.BEDROCK_MODEL_ID,
        contentType: 'application/json',
        body: JSON.stringify({
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.7
        })
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.completion || responseBody.generations?.[0]?.text || 'Conversation summary';
}

// Generate summary using Ollama
async function generateSummaryWithOllama(lastUserMessage, assistantResponse) {
    const model = process.env.OLLAMA_MODEL || 'llama3';
    const prompt = `Summarize this conversation in 2-3 sentences:

User: ${lastUserMessage}
Assistant: ${assistantResponse}

Summary:`;

    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: model,
            prompt: prompt,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || 'Conversation summary';
}

// Generate summary using Together AI
async function generateSummaryWithTogether(lastUserMessage, assistantResponse) {
    const prompt = `Summarize this conversation in 2-3 sentences:

User: ${lastUserMessage}
Assistant: ${assistantResponse}

Summary:`;

    const response = await fetch('https://api.together.xyz/v1/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`
        },
        body: JSON.stringify({
            model: 'meta-llama/Llama-2-7b-chat-hf',
            prompt: prompt,
            max_tokens: 150,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`Together AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.text || 'Conversation summary';
}

// Generate simple summary (fallback)
function generateSimpleSummary(messages, assistantResponse) {
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    return lastUserMessage.length > 100 ? lastUserMessage.substring(0, 100) + '...' : lastUserMessage;
}

// Save feedback
async function saveFeedback(userId, feedbackText) {
    try {
        const sql = `
      INSERT INTO feedback (user_id, feedback_text)
      VALUES ($1, $2)
      RETURNING id
    `;

        const result = await pool.query(sql, [userId, feedbackText]);
        logger.info(`Saved feedback for user ${userId}`);
        return result.rows[0].id;
    } catch (error) {
        logger.error('Error saving feedback:', error);
        throw error;
    }
}

// Get user feedback
async function getUserFeedback(userId) {
    try {
        const sql = `
      SELECT * FROM feedback 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

        const result = await pool.query(sql, [userId]);
        return result.rows;
    } catch (error) {
        logger.error('Error getting user feedback:', error);
        throw error;
    }
}

// Get all feedback
async function getAllFeedback() {
    try {
        const sql = `
      SELECT * FROM feedback 
      ORDER BY created_at DESC
    `;

        const result = await pool.query(sql);
        return result.rows;
    } catch (error) {
        logger.error('Error getting all feedback:', error);
        throw error;
    }
}

// Get feedback statistics
async function getFeedbackStats() {
    try {
        const sql = `
      SELECT 
        COUNT(*) as total_feedback,
        COUNT(DISTINCT user_id) as unique_users,
        MAX(created_at) as latest_feedback
      FROM feedback
    `;

        const result = await pool.query(sql);
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting feedback stats:', error);
        throw error;
    }
}

// Get user by Auth0 ID
async function getUserByAuth0Id(auth0UserId) {
    try {
        const sql = `
      SELECT * FROM users 
      WHERE auth0_user_id = $1
    `;

        const result = await pool.query(sql, [auth0UserId]);
        return result.rows[0] || null;
    } catch (error) {
        logger.error('Error getting user by Auth0 ID:', error);
        throw error;
    }
}

// Create user
async function createUser(auth0UserId, nickname, avatar = null) {
    try {
        const sql = `
      INSERT INTO users (auth0_user_id, nickname, avatar)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        const result = await pool.query(sql, [auth0UserId, nickname, avatar]);
        logger.info(`Created user with Auth0 ID: ${auth0UserId}`);
        return result.rows[0];
    } catch (error) {
        logger.error('Error creating user:', error);
        throw error;
    }
}

// Update user
async function updateUser(auth0UserId, nickname, avatar = null) {
    try {
        const sql = `
      UPDATE users 
      SET nickname = $2, avatar = $3, updated_at = CURRENT_TIMESTAMP
      WHERE auth0_user_id = $1
      RETURNING *
    `;

        const result = await pool.query(sql, [auth0UserId, nickname, avatar]);
        if (result.rowCount > 0) {
            logger.info(`Updated user with Auth0 ID: ${auth0UserId}`);
            return result.rows[0];
        } else {
            throw new Error('User not found');
        }
    } catch (error) {
        logger.error('Error updating user:', error);
        throw error;
    }
}

// Close database connection
async function closeDatabase() {
    try {
        await pool.end();
        logger.info('Database connection closed');
    } catch (error) {
        logger.error('Error closing database connection:', error);
        throw error;
    }
}

// Validate base64 image
function validateBase64Image(base64Data) {
    try {
        // Check if it's a valid base64 string
        if (!base64Data || typeof base64Data !== 'string') {
            return false;
        }

        // Check if it starts with data:image/
        if (!base64Data.startsWith('data:image/')) {
            return false;
        }

        // Extract the base64 part
        const base64Part = base64Data.split(',')[1];
        if (!base64Part) {
            return false;
        }

        // Check if it's valid base64
        const buffer = Buffer.from(base64Part, 'base64');
        return buffer.length > 0;
    } catch (error) {
        return false;
    }
}

// Save mood entry
async function saveMoodEntry(userId, moodScore, thoughts = null) {
    try {
        const sql = `
      INSERT INTO mood_entries (user_id, mood_score, thoughts)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

        const result = await pool.query(sql, [userId, moodScore, thoughts]);
        logger.info(`Saved mood entry for user ${userId}: ${moodScore}/5`);
        return result.rows[0].id;
    } catch (error) {
        logger.error('Error saving mood entry:', error);
        throw error;
    }
}

// Get user mood entries
async function getUserMoodEntries(userId, limit = 30) {
    try {
        const sql = `
      SELECT * FROM mood_entries 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;

        const result = await pool.query(sql, [userId, limit]);
        return result.rows;
    } catch (error) {
        logger.error('Error getting user mood entries:', error);
        throw error;
    }
}

// Get user mood statistics
async function getUserMoodStats(userId) {
    try {
        const sql = `
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_score) as average_mood,
        MIN(mood_score) as lowest_mood,
        MAX(mood_score) as highest_mood,
        COUNT(CASE WHEN mood_score >= 4 THEN 1 END) as good_days,
        COUNT(CASE WHEN mood_score <= 2 THEN 1 END) as bad_days
      FROM mood_entries 
      WHERE user_id = $1
    `;

        const result = await pool.query(sql, [userId]);
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting user mood stats:', error);
        throw error;
    }
}

// Get camp mood data
async function getCampMoodData(startDate = null, endDate = null) {
    try {
        let sql = `
      SELECT 
        DATE(created_at) as date,
        AVG(mood_score) as avg_mood,
        COUNT(*) as participant_count,
        STRING_AGG(DISTINCT thoughts, ' | ') as common_thoughts
      FROM mood_entries
    `;

        const params = [];
        if (startDate && endDate) {
            sql += ` WHERE DATE(created_at) BETWEEN $1 AND $2`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` WHERE DATE(created_at) >= $1`;
            params.push(startDate);
        }

        sql += `
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

        const result = await pool.query(sql, params);
        return result.rows;
    } catch (error) {
        logger.error('Error getting camp mood data:', error);
        throw error;
    }
}

// Get today's camp mood
async function getTodayCampMood() {
    try {
        const sql = `
      SELECT 
        AVG(mood_score) as avg_mood,
        COUNT(*) as participant_count,
        COUNT(DISTINCT user_id) as unique_participants,
        STRING_AGG(DISTINCT thoughts, ' | ') as common_thoughts
      FROM mood_entries 
      WHERE DATE(created_at) = CURRENT_DATE
    `;

        const result = await pool.query(sql);
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting today\'s camp mood:', error);
        throw error;
    }
}

// Get overall camp mood statistics
async function getOverallCampMoodStats() {
    try {
        const sql = `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(DISTINCT user_id) as unique_participants,
        AVG(mood_score) as overall_avg_mood,
        MIN(mood_score) as lowest_mood,
        MAX(mood_score) as highest_mood,
        COUNT(CASE WHEN mood_score >= 4 THEN 1 END) as good_days,
        COUNT(CASE WHEN mood_score <= 2 THEN 1 END) as bad_days
      FROM mood_entries
    `;

        const result = await pool.query(sql);
        return result.rows[0];
    } catch (error) {
        logger.error('Error getting overall camp mood stats:', error);
        throw error;
    }
}

// Get all participants' mood entries
async function getAllParticipantsMoodEntries(startDate = null, endDate = null) {
    try {
        let sql = `
      SELECT 
        me.*,
        u.nickname
      FROM mood_entries me
      LEFT JOIN users u ON me.user_id = u.auth0_user_id
    `;

        const params = [];
        if (startDate && endDate) {
            sql += ` WHERE DATE(me.created_at) BETWEEN $1 AND $2`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` WHERE DATE(me.created_at) >= $1`;
            params.push(startDate);
        }

        sql += ` ORDER BY me.created_at DESC`;

        const result = await pool.query(sql, params);
        return result.rows;
    } catch (error) {
        logger.error('Error getting all participants mood entries:', error);
        throw error;
    }
}

// Get participants mood by date
async function getParticipantsMoodByDate(startDate = null, endDate = null) {
    try {
        let sql = `
      SELECT 
        DATE(me.created_at) as date,
        me.user_id,
        u.nickname,
        me.mood_score,
        me.thoughts,
        me.id
      FROM mood_entries me
      LEFT JOIN users u ON me.user_id = u.auth0_user_id
    `;

        const params = [];
        if (startDate && endDate) {
            sql += ` WHERE DATE(me.created_at) BETWEEN $1 AND $2`;
            params.push(startDate, endDate);
        } else if (startDate) {
            sql += ` WHERE DATE(me.created_at) >= $1`;
            params.push(startDate);
        }

        sql += ` ORDER BY date DESC, me.created_at DESC`;

        const result = await pool.query(sql, params);

        // Group the results by date
        const groupedByDate = {};
        result.rows.forEach(row => {
            const date = row.date;
            if (!groupedByDate[date]) {
                groupedByDate[date] = [];
            }
            groupedByDate[date].push({
                id: row.id,
                user_id: row.user_id,
                nickname: row.nickname,
                mood_score: row.mood_score,
                thoughts: row.thoughts
            });
        });

        return groupedByDate;
    } catch (error) {
        logger.error('Error getting participants mood by date:', error);
        throw error;
    }
}

module.exports = {
    saveConversationSummary,
    getConversationSummary,
    getUserConversationSummaries,
    deleteConversationSummary,
    updateConversationSummary,
    getUserConversationCount,
    deleteOldConversations,
    getConversationStats,
    generateConversationId,
    generateConversationSummaryV2,
    saveFeedback,
    getUserFeedback,
    getAllFeedback,
    getFeedbackStats,
    getUserByAuth0Id,
    createUser,
    updateUser,
    closeDatabase,
    validateBase64Image,
    saveMoodEntry,
    getUserMoodEntries,
    getUserMoodStats,
    getCampMoodData,
    getTodayCampMood,
    getOverallCampMoodStats,
    getAllParticipantsMoodEntries,
    getParticipantsMoodByDate,
    pool
}; 