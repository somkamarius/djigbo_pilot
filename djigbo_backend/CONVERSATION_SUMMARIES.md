# Conversation Summaries API

This document describes the conversation summaries functionality that automatically saves and manages conversation summaries for each user.

## Overview

The system automatically saves conversation summaries to a SQLite database whenever a user interacts with the chat endpoints. Each conversation is identified by a unique conversation ID and associated with the authenticated user.

## Summary Generation Methods

### V1: Simple Summary (Default)
- Extracts the last user message and truncates to 100 characters
- Fast and reliable fallback method
- No external dependencies

### V2: LLM-Powered Summary (New!)
- Uses AI models to generate intelligent, contextual summaries
- Supports multiple providers: AWS Bedrock, Ollama, or simple fallback
- Configurable via `SUMMARY_PROVIDER` environment variable

## Environment Variables

```bash
# Summary generation provider ('bedrock', 'ollama', or 'simple')
SUMMARY_PROVIDER=bedrock

# AWS Bedrock configuration (for Bedrock summaries)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=meta.llama3-8b-instruct-v1:0

# Ollama configuration (for Ollama summaries)
OLLAMA_MODEL=llama3
```

## Database Schema

The `conversation_summaries` table has the following structure:

```sql
CREATE TABLE conversation_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, conversation_id)
)
```

## API Endpoints

### Chat Endpoints (Enhanced)

Both chat endpoints now return a `conversation_id` in their response and automatically save conversation summaries using the configured summary provider.

#### POST /api/chat (Bedrock)
```json
{
  "messages": [
    {"role": "user", "content": "Hello, how are you?"}
  ],
  "max_tokens": 1024,
  "conversation_id": "optional_existing_conversation_id"
}
```

Response:
```json
{
  "content": "I'm doing well, thank you for asking!",
  "conversation_id": "conv_1703123456789_abc123def"
}
```

#### POST /api/ollama-chat (Ollama)
Same request/response format as the Bedrock endpoint.

### Conversation Management Endpoints

#### GET /api/conversations
Get all conversation summaries for the authenticated user.

**Headers:** `Authorization: Bearer <jwt_token>`

Response:
```json
{
  "conversations": [
    {
      "id": 1,
      "user_id": "auth0|123456789",
      "conversation_id": "conv_1703123456789_abc123def",
      "summary": "Discussion about machine learning concepts and types",
      "message_count": 6,
      "created_at": "2023-12-21T10:30:45.123Z",
      "updated_at": "2023-12-21T10:30:45.123Z"
    }
  ],
  "count": 1,
  "timestamp": "2023-12-21T10:30:45.123Z"
}
```

#### GET /api/conversations/:conversationId
Get a specific conversation summary.

**Headers:** `Authorization: Bearer <jwt_token>`

Response:
```json
{
  "conversation": {
    "id": 1,
    "user_id": "auth0|123456789",
    "conversation_id": "conv_1703123456789_abc123def",
    "summary": "Discussion about machine learning concepts and types",
    "message_count": 6,
    "created_at": "2023-12-21T10:30:45.123Z",
    "updated_at": "2023-12-21T10:30:45.123Z"
  },
  "timestamp": "2023-12-21T10:30:45.123Z"
}
```

#### DELETE /api/conversations/:conversationId
Delete a specific conversation summary.

**Headers:** `Authorization: Bearer <jwt_token>`

Response:
```json
{
  "message": "Conversation deleted successfully",
  "deletedCount": 1,
  "timestamp": "2023-12-21T10:30:45.123Z"
}
```

#### GET /api/conversations/count
Get the total number of conversations for the authenticated user.

**Headers:** `Authorization: Bearer <jwt_token>`

Response:
```json
{
  "count": 5,
  "userId": "auth0|123456789",
  "timestamp": "2023-12-21T10:30:45.123Z"
}
```

#### GET /api/conversations/stats
Get overall conversation statistics (admin endpoint).

**Headers:** `Authorization: Bearer <jwt_token>`

Response:
```json
{
  "stats": {
    "total_conversations": 150,
    "unique_users": 25,
    "avg_message_count": 3.2,
    "latest_conversation": "2023-12-21T10:30:45.123Z",
    "earliest_conversation": "2023-12-01T08:15:30.456Z"
  },
  "timestamp": "2023-12-21T10:30:45.123Z"
}
```

#### POST /api/test-summary
Test the summary generation functionality with different providers.

**Headers:** `Authorization: Bearer <jwt_token>`

Request:
```json
{
  "messages": [
    {"role": "user", "content": "Can you help me understand machine learning?"},
    {"role": "assistant", "content": "Of course! Machine learning is a subset of AI..."}
  ],
  "assistant_response": "That's a great question! Let me explain...",
  "provider": "bedrock"
}
```

Response:
```json
{
  "summary": "Discussion about machine learning concepts and AI fundamentals",
  "provider": "bedrock",
  "message_count": 2,
  "timestamp": "2023-12-21T10:30:45.123Z"
}
```

## How It Works

1. **Automatic Summary Generation**: When a user sends a message, the system automatically generates a summary using the configured provider:
   - **Bedrock**: Uses AWS Bedrock models for intelligent summarization
   - **Ollama**: Uses local Ollama models for summarization
   - **Simple**: Falls back to basic text truncation

2. **Conversation ID Management**: Each conversation gets a unique ID. If a `conversation_id` is provided in the request, it will be used; otherwise, a new one is generated. The frontend automatically manages conversation IDs to retain the same ID for the same conversation and only create new IDs when different conversations are initiated.

3. **Database Storage**: Conversation summaries are stored in SQLite with user isolation - users can only access their own conversation summaries.

4. **Error Handling**: If LLM summary generation fails, the system automatically falls back to simple summarization.

## Testing

Run the database test to verify functionality:

```bash
npm run test:db
# or
node test-database.js
```

Run the summary generation test:

```bash
npm run test:summary
# or
node test-summary-v2.js
```

## Database File

The SQLite database is stored in `conversations.db` in the project root. This file should be backed up regularly and included in your deployment strategy.

## Security

- All conversation management endpoints require authentication via Auth0 JWT tokens
- Users can only access their own conversation summaries
- Conversation IDs are unique per user to prevent conflicts

## Database Utilities

The database module also provides additional utility functions:

- `getUserConversationCount(userId)` - Get conversation count for a user
- `deleteOldConversations(daysOld)` - Delete conversations older than specified days
- `getConversationStats()` - Get overall conversation statistics
- `generateConversationId()` - Generate unique conversation IDs
- `generateConversationSummaryV2(messages, response, provider)` - Generate LLM-powered summaries
- `generateSummaryWithBedrock(prompt)` - Generate summaries using AWS Bedrock
- `generateSummaryWithOllama(prompt)` - Generate summaries using Ollama
- `generateSimpleSummary(messages, response)` - Generate simple fallback summaries

## Frontend Conversation Management

The frontend application (`djigbo_webapp`) includes intelligent conversation ID management:

### Automatic Conversation Detection
- **Similarity Analysis**: Uses word overlap analysis to determine if a new message belongs to the current conversation
- **Threshold-based**: 30% similarity threshold to determine if a message starts a new conversation
- **Context Awareness**: Considers the relationship between consecutive user messages

### User Interface Features
- **New Conversation Button**: Manual option to start a fresh conversation
- **Conversation ID Display**: Shows the current conversation ID (truncated for readability)
- **Visual Feedback**: Clear indication of active conversation state

### Conversation Flow
1. **First Message**: Automatically creates a new conversation ID
2. **Follow-up Messages**: Retains the same conversation ID for related messages
3. **Topic Change**: Automatically detects new topics and creates new conversation IDs
4. **Manual Reset**: Users can manually start new conversations using the "New Conversation" button

## Summary Quality Comparison

| Method | Quality | Speed | Dependencies | Use Case |
|--------|---------|-------|--------------|----------|
| Simple | Basic | Fast | None | Fallback, simple conversations |
| Ollama | Good | Medium | Local Ollama | Privacy-focused, local processing |
| Bedrock | Excellent | Slow | AWS credentials | Production, high-quality summaries | 