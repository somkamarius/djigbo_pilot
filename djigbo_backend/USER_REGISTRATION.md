# User Registration System

This document describes the user registration flow implemented in the Džigbo application.

## Overview

After a user logs in with Auth0, the system checks if they exist in the local database. If not, they are prompted to complete their profile with a nickname and optional avatar URL.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  auth0_user_id TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Backend Endpoints

### 1. Check User Existence
- **GET** `/api/user/check`
- **Authentication**: Required (Auth0 JWT)
- **Response**: 
  ```json
  {
    "exists": true/false,
    "user": { user object or null },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

### 2. Register New User
- **POST** `/api/user/register`
- **Authentication**: Required (Auth0 JWT)
- **Body**:
  ```json
  {
    "nickname": "User's nickname",
    "avatar": "https://example.com/avatar.jpg" // optional
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "userId": 123,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

### 3. Update User
- **PUT** `/api/user/update`
- **Authentication**: Required (Auth0 JWT)
- **Body**: Same as register
- **Response**:
  ```json
  {
    "message": "User updated successfully",
    "updatedCount": 1,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

## Frontend Flow

1. **Login**: User logs in with Auth0
2. **User Check**: App checks if user exists in database
3. **Registration**: If user doesn't exist, show registration form
4. **Profile Completion**: User enters nickname and optional avatar
5. **Continue**: After registration, user proceeds to main app

## Components

### UserRegistration.jsx
- Registration form component
- Handles nickname and avatar input
- Submits to `/api/user/register` endpoint
- Calls `onRegistrationComplete` callback when done

### App.jsx Modifications
- Added user existence checking logic
- Conditional rendering of registration screen
- State management for user registration flow

## API Integration

The frontend uses the Auth0 `getAccessTokenSilently()` function to get JWT tokens for API calls. All user management endpoints require valid Auth0 JWT tokens.

## Error Handling

- **400**: Invalid input (missing nickname, etc.)
- **401**: Unauthorized (invalid/missing token)
- **404**: User not found (for update operations)
- **409**: User already exists (for registration)

## Testing

Use the `test-user-endpoints.js` script to test the backend endpoints:

```bash
cd djigbo_backend
node test-user-endpoints.js
```

Note: You'll need to replace the mock token with a real Auth0 JWT token for testing.

## Environment Variables

No additional environment variables are required beyond the existing Auth0 configuration. 