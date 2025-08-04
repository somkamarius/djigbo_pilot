# PostgreSQL Migration Guide

This guide explains how to migrate from SQLite to PostgreSQL in the Djigbo backend.

## Overview

The backend has been updated to use PostgreSQL instead of SQLite for better scalability, performance, and concurrent access support.

## Changes Made

### 1. Database Configuration
- Replaced SQLite with PostgreSQL using the `pg` package
- Updated all database queries to use PostgreSQL syntax
- Added connection pooling for better performance
- Changed parameterized queries from `?` to `$1, $2, etc.`
- Added SSL configuration for production environments

### 2. Schema Changes
- Changed `INTEGER PRIMARY KEY AUTOINCREMENT` to `SERIAL PRIMARY KEY`
- Changed `DATETIME` to `TIMESTAMP`
- Changed `TEXT` date fields to `DATE` type
- Changed `REAL` to `DECIMAL(3,2)` for mood scores
- Added database indexes for better performance

### 3. Environment Variables
The following environment variables are now required:

```bash
# PostgreSQL Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/djigbo_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=djigbo_db
DB_USER=username
DB_PASSWORD=password

# For production with SSL (e.g., DigitalOcean Managed Database)
DATABASE_URL=postgresql://username:password@host:port/djigbo_db?sslmode=require
NODE_ENV=production
```

## SSL Configuration

### Production Environments
For production environments (like DigitalOcean Managed Databases), SSL is automatically configured:

```bash
# The application will automatically use SSL in production
NODE_ENV=production
```

### Custom SSL Configuration
If your DATABASE_URL includes SSL parameters, they will be used automatically:

```bash
# Example with SSL mode in connection string
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&sslcert=path/to/cert
```

### Development
SSL is disabled by default in development environments.

## Setup Instructions

### 1. Install PostgreSQL Dependencies
```bash
npm install pg
```

### 2. Create .env File
Copy the `.env.example` file to `.env` and update the PostgreSQL configuration:

```bash
cp .env.example .env
```

Edit the `.env` file with your PostgreSQL credentials:
```bash
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/djigbo_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=djigbo_db
DB_USER=your_username
DB_PASSWORD=your_password
```

### 3. Set Up PostgreSQL Database

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL container
docker-compose up postgres -d

# Or start all services
docker-compose up -d
```

#### Option B: Local PostgreSQL Installation
1. Install PostgreSQL on your system
2. Create a database:
```sql
CREATE DATABASE djigbo_db;
CREATE USER username WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE djigbo_db TO username;
```

### 4. Run Database Migration (Optional)
If you have existing SQLite data that you want to migrate:

```bash
npm run migrate
```

This will:
- Connect to your existing SQLite database
- Transfer all data to PostgreSQL
- Preserve all existing records

### 5. Start the Application
```bash
npm start
```

The application will automatically:
- Connect to PostgreSQL
- Create all necessary tables
- Set up indexes for optimal performance

## Docker Setup

The `docker-compose.yml` file has been updated to include PostgreSQL:

```yaml
postgres:
  image: 'postgres:15'
  container_name: postgres-db
  environment:
    POSTGRES_DB: djigbo_db
    POSTGRES_USER: username
    POSTGRES_PASSWORD: password
  ports:
    - '5432:5432'
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

## Database Schema

### Tables Created
1. **conversation_summaries** - Stores chat conversation summaries
2. **feedback** - Stores user feedback
3. **users** - Stores user information
4. **mood_entries** - Stores daily mood entries
5. **mood_stats** - Stores aggregated mood statistics

### Indexes
The following indexes are automatically created for better performance:
- `idx_conversation_summaries_user_id`
- `idx_conversation_summaries_conversation_id`
- `idx_feedback_user_id`
- `idx_users_auth0_user_id`
- `idx_mood_entries_user_id`
- `idx_mood_entries_created_at`
- `idx_mood_stats_date`

## API Compatibility

All existing API endpoints remain unchanged. The migration is transparent to the frontend and other clients.

## Troubleshooting

### Connection Issues
1. Verify PostgreSQL is running: `docker-compose ps` or `pg_isready`
2. Check environment variables in `.env` file
3. Ensure database exists: `psql -U username -d djigbo_db`

### SSL Certificate Issues
If you encounter SSL certificate errors in production:

1. **For DigitalOcean Managed Databases:**
   ```bash
   # Set NODE_ENV to production
   NODE_ENV=production
   ```

2. **For custom SSL certificates:**
   ```bash
   # Include SSL parameters in DATABASE_URL
   DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require&sslcert=path/to/cert
   ```

3. **Test SSL connection:**
   ```bash
   npm run test:postgres
   ```

### Migration Issues
1. Ensure SQLite database file exists: `conversations.db`
2. Check PostgreSQL connection before running migration
3. Verify all environment variables are set

### Performance Issues
1. Monitor connection pool settings
2. Check database indexes are created
3. Review query performance with `EXPLAIN ANALYZE`

## Rollback Plan

If you need to rollback to SQLite:
1. Keep the old `database.js` file as backup
2. Restore `package.json` dependencies
3. Update environment variables
4. Restart the application

## Benefits of PostgreSQL

1. **Better Concurrency** - Handles multiple simultaneous connections
2. **ACID Compliance** - Full transaction support
3. **Advanced Features** - JSON support, full-text search, etc.
4. **Scalability** - Better performance with large datasets
5. **Production Ready** - Industry standard for production deployments 