const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('./logger');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const fetch = require('node-fetch');

// Database file path
const dbPath = path.join(__dirname, 'conversations.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        logger.error('Error opening database:', err.message);
    } else {
        logger.info('Connected to SQLite database');
    }
});

// Initialize database tables immediately
initializeDatabase();

// Initialize database tables
function initializeDatabase() {
    const createConversationTableSQL = `
    CREATE TABLE IF NOT EXISTS conversation_summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, conversation_id)
    )
  `;

    const createFeedbackTableSQL = `
    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      feedback_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

    const createUsersTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      auth0_user_id TEXT UNIQUE NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

    const createMoodTableSQL = `
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      mood_score INTEGER NOT NULL CHECK (mood_score >= 1 AND mood_score <= 5),
      thoughts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

    const createMoodStatsTableSQL = `
    CREATE TABLE IF NOT EXISTS mood_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      avg_mood REAL NOT NULL,
      participant_count INTEGER NOT NULL,
      common_thoughts TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date)
    )
  `;

    return new Promise((resolve, reject) => {
        // Create conversation summaries table
        db.run(createConversationTableSQL, (err) => {
            if (err) {
                logger.error('Error creating conversation summaries table:', err.message);
                reject(err);
            } else {
                logger.info('Conversation summaries table ready');

                // Create feedback table
                db.run(createFeedbackTableSQL, (err) => {
                    if (err) {
                        logger.error('Error creating feedback table:', err.message);
                        reject(err);
                    } else {
                        logger.info('Feedback table ready');

                        // Create users table
                        db.run(createUsersTableSQL, (err) => {
                            if (err) {
                                logger.error('Error creating users table:', err.message);
                                reject(err);
                            } else {
                                logger.info('Users table ready');

                                // Create mood entries table
                                db.run(createMoodTableSQL, (err) => {
                                    if (err) {
                                        logger.error('Error creating mood entries table:', err.message);
                                        reject(err);
                                    } else {
                                        logger.info('Mood entries table ready');

                                        // Create mood stats table
                                        db.run(createMoodStatsTableSQL, (err) => {
                                            if (err) {
                                                logger.error('Error creating mood stats table:', err.message);
                                                reject(err);
                                            } else {
                                                logger.info('Mood stats table ready');
                                                resolve();
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    });
}

// Save conversation summary
function saveConversationSummary(userId, conversationId, summary, messageCount = 0) {
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT OR REPLACE INTO conversation_summaries 
      (user_id, conversation_id, summary, message_count, updated_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;

        db.run(sql, [userId, conversationId, summary, messageCount], function (err) {
            if (err) {
                logger.error('Error saving conversation summary:', err.message);
                reject(err);
            } else {
                logger.info(`Saved conversation summary for user ${userId}, conversation ${conversationId}`);
                resolve(this.lastID);
            }
        });
    });
}

// Get conversation summary by user and conversation ID
function getConversationSummary(userId, conversationId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM conversation_summaries 
      WHERE user_id = ? AND conversation_id = ?
    `;

        db.get(sql, [userId, conversationId], (err, row) => {
            if (err) {
                logger.error('Error getting conversation summary:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Get all conversation summaries for a user
function getUserConversationSummaries(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM conversation_summaries 
      WHERE user_id = ? 
      ORDER BY updated_at DESC
    `;

        db.all(sql, [userId], (err, rows) => {
            if (err) {
                logger.error('Error getting user conversation summaries:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Delete conversation summary
function deleteConversationSummary(userId, conversationId) {
    return new Promise((resolve, reject) => {
        const sql = `
      DELETE FROM conversation_summaries 
      WHERE user_id = ? AND conversation_id = ?
    `;

        db.run(sql, [userId, conversationId], function (err) {
            if (err) {
                logger.error('Error deleting conversation summary:', err.message);
                reject(err);
            } else {
                logger.info(`Deleted conversation summary for user ${userId}, conversation ${conversationId}`);
                resolve(this.changes);
            }
        });
    });
}

// Update conversation summary
function updateConversationSummary(userId, conversationId, summary, messageCount) {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE conversation_summaries 
      SET summary = ?, message_count = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND conversation_id = ?
    `;

        db.run(sql, [summary, messageCount, userId, conversationId], function (err) {
            if (err) {
                logger.error('Error updating conversation summary:', err.message);
                reject(err);
            } else {
                logger.info(`Updated conversation summary for user ${userId}, conversation ${conversationId}`);
                resolve(this.changes);
            }
        });
    });
}

// Get conversation count for a user
function getUserConversationCount(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT COUNT(*) as count FROM conversation_summaries 
      WHERE user_id = ?
    `;

        db.get(sql, [userId], (err, row) => {
            if (err) {
                logger.error('Error getting user conversation count:', err.message);
                reject(err);
            } else {
                resolve(row ? row.count : 0);
            }
        });
    });
}

// Delete old conversations (older than specified days)
function deleteOldConversations(daysOld = 30) {
    return new Promise((resolve, reject) => {
        const sql = `
      DELETE FROM conversation_summaries 
      WHERE updated_at < datetime('now', '-${daysOld} days')
    `;

        db.run(sql, function (err) {
            if (err) {
                logger.error('Error deleting old conversations:', err.message);
                reject(err);
            } else {
                logger.info(`Deleted ${this.changes} old conversations (older than ${daysOld} days)`);
                resolve(this.changes);
            }
        });
    });
}

// Get conversation statistics
function getConversationStats() {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT 
        COUNT(*) as total_conversations,
        COUNT(DISTINCT user_id) as unique_users,
        AVG(message_count) as avg_message_count,
        MAX(created_at) as latest_conversation,
        MIN(created_at) as earliest_conversation
      FROM conversation_summaries
    `;

        db.get(sql, (err, row) => {
            if (err) {
                logger.error('Error getting conversation stats:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Generate a unique conversation ID
function generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// V2: Generate conversation summary using LLM
async function generateConversationSummaryV2(messages, assistantResponse, provider = 'ollama') {
    try {
        // Create a comprehensive conversation context
        const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        const fullConversation = `${conversationText}\nassistant: ${assistantResponse}`;

        // Create a summary prompt
        const summaryPrompt = `Please analyze the user's personality based on the Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) from this conversation. Provide a concise summary in only 10 words focusing on the user's personality characteristics, communication style, and behavioral patterns:

${fullConversation}

Personality Summary:`;

        let summary = '';

        if (provider === 'bedrock') {
            summary = await generateSummaryWithBedrock(summaryPrompt);
        } else if (provider === 'ollama') {
            summary = await generateSummaryWithOllama(summaryPrompt);
        } else {
            // Fallback to simple summary
            summary = generateSimpleSummary(messages, assistantResponse);
        }

        return summary;
    } catch (error) {
        logger.error('Error generating LLM summary:', error);
        // Fallback to simple summary if LLM fails
        return generateSimpleSummary(messages, assistantResponse);
    }
}

// Generate summary using AWS Bedrock
async function generateSummaryWithBedrock(prompt) {
    try {
        const client = new BedrockRuntimeClient({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
        });

        const body = {
            prompt: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are a helpful assistant that creates concise summaries of conversations.\n<|eot_id|><|start_header_id|>user<|end_header_id|>\n${prompt}\n<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n`,
            max_gen_len: 150,
            temperature: 0.3,
            top_p: 0.9
        };

        const command = new InvokeModelCommand({
            modelId: process.env.BEDROCK_MODEL_ID,
            contentType: 'application/json',
            body: JSON.stringify(body),
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        return responseBody.generation.trim();
    } catch (error) {
        logger.error('Error generating Bedrock summary:', error);
        throw error;
    }
}

// Generate summary using Ollama
async function generateSummaryWithOllama(prompt) {
    try {
        const model = process.env.OLLAMA_MODEL || 'llama3';
        const ollamaBody = {
            model,
            prompt,
            stream: false,
            options: {
                num_predict: 150,
                temperature: 0.3
            }
        };

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ollamaBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${errorText}`);
        }

        const data = await response.json();
        return data.response.trim();
    } catch (error) {
        logger.error('Error generating Ollama summary:', error);
        throw error;
    }
}

// Fallback simple summary function (original logic)
function generateSimpleSummary(messages, assistantResponse) {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const lastUserMessage = userMessages[userMessages.length - 1];

    if (lastUserMessage) {
        const summary = lastUserMessage.content.length > 100
            ? lastUserMessage.content.substring(0, 100) + '...'
            : lastUserMessage.content;
        return summary;
    }

    return 'Conversation started';
}

// Save feedback
function saveFeedback(userId, feedbackText) {
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO feedback (user_id, feedback_text) 
      VALUES (?, ?)
    `;

        db.run(sql, [userId, feedbackText], function (err) {
            if (err) {
                logger.error('Error saving feedback:', err.message);
                reject(err);
            } else {
                logger.info(`Saved feedback for user ${userId}`);
                resolve(this.lastID);
            }
        });
    });
}

// Get all feedback for a user
function getUserFeedback(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM feedback 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;

        db.all(sql, [userId], (err, rows) => {
            if (err) {
                logger.error('Error getting user feedback:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get all feedback (admin function)
function getAllFeedback() {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM feedback 
      ORDER BY created_at DESC
    `;

        db.all(sql, (err, rows) => {
            if (err) {
                logger.error('Error getting all feedback:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get feedback statistics
function getFeedbackStats() {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT 
        COUNT(*) as total_feedback,
        COUNT(DISTINCT user_id) as unique_users,
        MAX(created_at) as latest_feedback,
        MIN(created_at) as earliest_feedback
      FROM feedback
    `;

        db.get(sql, (err, row) => {
            if (err) {
                logger.error('Error getting feedback stats:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Check if user exists in the users table
function getUserByAuth0Id(auth0UserId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM users 
      WHERE auth0_user_id = ?
    `;

        db.get(sql, [auth0UserId], (err, row) => {
            if (err) {
                logger.error('Error getting user by Auth0 ID:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Create a new user
function createUser(auth0UserId, nickname, avatar = null) {
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO users (auth0_user_id, nickname, avatar, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

        db.run(sql, [auth0UserId, nickname, avatar], function (err) {
            if (err) {
                logger.error('Error creating user:', err.message);
                reject(err);
            } else {
                logger.info(`Created user with Auth0 ID ${auth0UserId}`);
                resolve(this.lastID);
            }
        });
    });
}

// Update user information
function updateUser(auth0UserId, nickname, avatar = null) {
    return new Promise((resolve, reject) => {
        const sql = `
      UPDATE users 
      SET nickname = ?, avatar = ?, updated_at = CURRENT_TIMESTAMP
      WHERE auth0_user_id = ?
    `;

        db.run(sql, [nickname, avatar, auth0UserId], function (err) {
            if (err) {
                logger.error('Error updating user:', err.message);
                reject(err);
            } else {
                logger.info(`Updated user with Auth0 ID ${auth0UserId}`);
                resolve(this.changes);
            }
        });
    });
}

// Close database connection
function closeDatabase() {
    db.close((err) => {
        if (err) {
            logger.error('Error closing database:', err.message);
        } else {
            logger.info('Database connection closed');
        }
    });
}

// Utility function to validate base64 image data
function validateBase64Image(base64Data) {
    if (!base64Data || typeof base64Data !== 'string') {
        return { valid: false, error: 'Invalid data format' };
    }

    if (!base64Data.startsWith('data:image/')) {
        return { valid: false, error: 'Not a valid image data URL' };
    }

    // Check file size (base64 is ~33% larger than binary)
    const base64String = base64Data.split(',')[1];
    if (!base64String) {
        return { valid: false, error: 'Invalid base64 data' };
    }

    const sizeInBytes = Math.ceil((base64String.length * 3) / 4);
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB

    if (sizeInBytes > maxSizeInBytes) {
        return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    return { valid: true, size: sizeInBytes };
}

// Save mood entry
function saveMoodEntry(userId, moodScore, thoughts = null) {
    return new Promise((resolve, reject) => {
        const sql = `
      INSERT INTO mood_entries (user_id, mood_score, thoughts, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

        db.run(sql, [userId, moodScore, thoughts], function (err) {
            if (err) {
                logger.error('Error saving mood entry:', err.message);
                reject(err);
            } else {
                logger.info(`Saved mood entry for user ${userId} with score ${moodScore}`);
                resolve(this.lastID);
            }
        });
    });
}

// Get user's mood entries
function getUserMoodEntries(userId, limit = 30) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT * FROM mood_entries 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;

        db.all(sql, [userId, limit], (err, rows) => {
            if (err) {
                logger.error('Error getting user mood entries:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get user's mood statistics
function getUserMoodStats(userId) {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT 
        COUNT(*) as total_entries,
        AVG(mood_score) as avg_mood,
        MIN(mood_score) as min_mood,
        MAX(mood_score) as max_mood,
        COUNT(DISTINCT DATE(created_at)) as days_with_entries
      FROM mood_entries 
      WHERE user_id = ?
    `;

        db.get(sql, [userId], (err, row) => {
            if (err) {
                logger.error('Error getting user mood stats:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Get camp-wide mood data for a specific date range
function getCampMoodData(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
        let sql = `
      SELECT 
        DATE(created_at) as date,
        AVG(mood_score) as avg_mood,
        COUNT(DISTINCT user_id) as participant_count,
        GROUP_CONCAT(DISTINCT thoughts) as thoughts
      FROM mood_entries 
    `;

        const params = [];
        if (startDate && endDate) {
            sql += ` WHERE DATE(created_at) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        sql += ` GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 14`;

        db.all(sql, params, (err, rows) => {
            if (err) {
                logger.error('Error getting camp mood data:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get today's camp mood summary
function getTodayCampMood() {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT 
        AVG(mood_score) as avg_mood,
        COUNT(DISTINCT user_id) as participant_count
      FROM mood_entries 
      WHERE DATE(created_at) = DATE('now')
    `;

        db.get(sql, [], (err, row) => {
            if (err) {
                logger.error('Error getting today\'s camp mood:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Get overall camp mood statistics
function getOverallCampMoodStats() {
    return new Promise((resolve, reject) => {
        const sql = `
      SELECT 
        COUNT(DISTINCT user_id) as total_participants,
        AVG(mood_score) as overall_avg_mood,
        COUNT(*) as total_entries,
        COUNT(DISTINCT DATE(created_at)) as total_days
      FROM mood_entries
    `;

        db.get(sql, [], (err, row) => {
            if (err) {
                logger.error('Error getting overall camp mood stats:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

// Get all participants' mood entries with user information
function getAllParticipantsMoodEntries(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
        let sql = `
      SELECT 
        me.id,
        me.user_id,
        me.mood_score,
        me.thoughts,
        me.created_at,
        u.nickname,
        u.avatar
      FROM mood_entries me
      LEFT JOIN users u ON me.user_id = u.auth0_user_id
    `;

        const params = [];
        if (startDate && endDate) {
            sql += ` WHERE DATE(me.created_at) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        sql += ` ORDER BY me.created_at DESC, u.nickname`;

        db.all(sql, params, (err, rows) => {
            if (err) {
                logger.error('Error getting all participants mood entries:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Get participants' mood entries grouped by date
function getParticipantsMoodByDate(startDate = null, endDate = null) {
    return new Promise((resolve, reject) => {
        let sql = `
      SELECT 
        DATE(me.created_at) as date,
        me.user_id,
        me.mood_score,
        me.thoughts,
        me.created_at,
        u.nickname,
        u.avatar
      FROM mood_entries me
      LEFT JOIN users u ON me.user_id = u.auth0_user_id
    `;

        const params = [];
        if (startDate && endDate) {
            sql += ` WHERE DATE(me.created_at) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        sql += ` ORDER BY me.created_at DESC, u.nickname`;

        db.all(sql, params, (err, rows) => {
            if (err) {
                logger.error('Error getting participants mood by date:', err.message);
                reject(err);
            } else {
                // Group by date
                const groupedData = {};
                rows.forEach(row => {
                    const date = row.date;
                    if (!groupedData[date]) {
                        groupedData[date] = [];
                    }
                    groupedData[date].push(row);
                });
                resolve(groupedData);
            }
        });
    });
}

module.exports = {
    db,
    initializeDatabase,
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
    generateSummaryWithBedrock,
    generateSummaryWithOllama,
    generateSimpleSummary,
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
    getParticipantsMoodByDate,
    closeDatabase
}; 