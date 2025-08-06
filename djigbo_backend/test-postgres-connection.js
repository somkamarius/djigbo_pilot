const { Pool } = require('pg');
const Sentry = require("@sentry/node");
const { logger } = Sentry;
require('dotenv').config();

async function testPostgreSQLConnection() {
    console.log('Testing PostgreSQL connection...\n');

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

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'djigbo_db',
        user: process.env.DB_USER || 'username',
        password: process.env.DB_PASSWORD || 'password',
        ssl: getSSLConfig(),
    });

    try {
        // Test 1: Basic connection
        console.log('1. Testing basic connection...');
        const client = await pool.connect();
        console.log('✅ Successfully connected to PostgreSQL');

        // Test 2: Simple query
        console.log('\n2. Testing simple query...');
        const result = await client.query('SELECT NOW() as current_time');
        console.log(`✅ Current database time: ${result.rows[0].current_time}`);

        // Test 3: Check if tables exist
        console.log('\n3. Checking database tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);

        console.log('✅ Available tables:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Test 4: Test table creation (if tables don't exist)
        if (tablesResult.rows.length === 0) {
            console.log('\n4. Creating test table...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS test_table (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Test table created successfully');
        }

        // Test 5: Test insert and select
        console.log('\n5. Testing insert and select...');
        await client.query('INSERT INTO test_table (name) VALUES ($1)', ['PostgreSQL Test']);
        const selectResult = await client.query('SELECT * FROM test_table ORDER BY id DESC LIMIT 1');
        console.log(`✅ Inserted and retrieved: ${selectResult.rows[0].name}`);

        // Test 6: Test connection pool
        console.log('\n6. Testing connection pool...');
        const poolSize = pool.totalCount;
        const idleCount = pool.idleCount;
        console.log(`✅ Pool status - Total: ${poolSize}, Idle: ${idleCount}`);

        client.release();
        console.log('\n🎉 All PostgreSQL tests passed!');

    } catch (error) {
        console.error('❌ PostgreSQL test failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
    } finally {
        await pool.end();
        console.log('\nPostgreSQL connection closed');
    }
}

// Run the test
testPostgreSQLConnection(); 