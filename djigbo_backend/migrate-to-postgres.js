const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const Sentry = require("@sentry/node");
const { logger } = Sentry;
require('dotenv').config();

// SQLite database connection
const sqliteDb = new sqlite3.Database(path.join(__dirname, 'conversations.db'));

// PostgreSQL connection
const getSSLConfig = () => {
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

const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'djigbo_db',
    user: process.env.DB_USER || 'username',
    password: process.env.DB_PASSWORD || 'password',
    ssl: getSSLConfig(),
});

async function migrateData() {
    try {
        logger.info('Starting migration from SQLite to PostgreSQL...');

        // Migrate conversation summaries
        await migrateConversationSummaries();

        // Migrate feedback
        await migrateFeedback();

        // Migrate users
        await migrateUsers();

        // Migrate mood entries
        await migrateMoodEntries();

        // Migrate mood stats
        await migrateMoodStats();

        logger.info('Migration completed successfully!');
    } catch (error) {
        logger.error('Migration failed:', error);
        throw error;
    } finally {
        await pgPool.end();
        sqliteDb.close();
    }
}

async function migrateConversationSummaries() {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM conversation_summaries', async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                for (const row of rows) {
                    await pgPool.query(`
                        INSERT INTO conversation_summaries 
                        (user_id, conversation_id, summary, message_count, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (user_id, conversation_id) DO NOTHING
                    `, [
                        row.user_id,
                        row.conversation_id,
                        row.summary,
                        row.message_count,
                        row.created_at,
                        row.updated_at
                    ]);
                }
                logger.info(`Migrated ${rows.length} conversation summaries`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function migrateFeedback() {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM feedback', async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                for (const row of rows) {
                    await pgPool.query(`
                        INSERT INTO feedback (user_id, feedback_text, created_at)
                        VALUES ($1, $2, $3)
                    `, [row.user_id, row.feedback_text, row.created_at]);
                }
                logger.info(`Migrated ${rows.length} feedback entries`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function migrateUsers() {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM users', async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                for (const row of rows) {
                    await pgPool.query(`
                        INSERT INTO users (auth0_user_id, nickname, avatar, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (auth0_user_id) DO NOTHING
                    `, [
                        row.auth0_user_id,
                        row.nickname,
                        row.avatar,
                        row.created_at,
                        row.updated_at
                    ]);
                }
                logger.info(`Migrated ${rows.length} users`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function migrateMoodEntries() {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM mood_entries', async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                for (const row of rows) {
                    await pgPool.query(`
                        INSERT INTO mood_entries (user_id, mood_score, thoughts, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [
                        row.user_id,
                        row.mood_score,
                        row.thoughts,
                        row.created_at,
                        row.updated_at
                    ]);
                }
                logger.info(`Migrated ${rows.length} mood entries`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function migrateMoodStats() {
    return new Promise((resolve, reject) => {
        sqliteDb.all('SELECT * FROM mood_stats', async (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            try {
                for (const row of rows) {
                    await pgPool.query(`
                        INSERT INTO mood_stats (date, avg_mood, participant_count, common_thoughts, created_at, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (date) DO NOTHING
                    `, [
                        row.date,
                        row.avg_mood,
                        row.participant_count,
                        row.common_thoughts,
                        row.created_at,
                        row.updated_at
                    ]);
                }
                logger.info(`Migrated ${rows.length} mood stats entries`);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}

// Run migration if this script is executed directly
if (require.main === module) {
    migrateData()
        .then(() => {
            logger.info('Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateData }; 