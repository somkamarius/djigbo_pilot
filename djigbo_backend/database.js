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
                        resolve();
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
        const summaryPrompt = `Please analyze the user's personality based on the Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) from this conversation. Provide a concise summary in 1-2 sentences focusing on the user's personality characteristics, communication style, and behavioral patterns:

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
    closeDatabase
}; 