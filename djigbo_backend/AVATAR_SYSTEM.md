# Avatar System Documentation

This document describes the avatar system implementation in the Džigbo application.

## Overview

The avatar system allows users to upload profile pictures that are stored as base64 data in the database and served through a dedicated API endpoint.

## Backend Implementation

### Database Storage
- Avatars are stored as base64 data URLs in the `users.avatar` field (TEXT type)
- Format: `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...`
- Maximum file size: 5MB (before base64 encoding)

### API Endpoints

#### 1. Register User with Avatar
- **POST** `/api/user/register`
- **Authentication**: Required (Auth0 JWT)
- **Body**:
  ```json
  {
    "nickname": "User's nickname",
    "avatar": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..." // optional
  }
  ```

#### 2. Update User Avatar
- **PUT** `/api/user/update`
- **Authentication**: Required (Auth0 JWT)
- **Body**: Same as register

#### 3. Get User Avatar
- **GET** `/api/user/avatar/:userId`
- **Authentication**: Not required
- **Response**: Image data with appropriate Content-Type header
- **Caching**: 1 year cache headers for performance

### Validation
- File type: JPG, PNG only
- File size: Maximum 5MB
- Format: Must be valid base64 data URL starting with `data:image/`

## Frontend Implementation

### Utility Functions (`avatarUtils.js`)

#### `getAvatarUrl(userId, fallbackUrl)`
Returns the URL for fetching a user's avatar.

#### `fileToBase64(file)`
Converts a File object to base64 data URL.

#### `validateAvatarFile(file)`
Validates file type and size for avatar upload.

### Avatar Component (`Avatar.jsx`)
Reusable component for displaying user avatars with fallback support.

```jsx
import Avatar from './components/Avatar';

// Basic usage
<Avatar userId="auth0|123456" />

// With custom size and fallback
<Avatar 
    userId="auth0|123456" 
    size={64} 
    fallbackUrl="/default-avatar.png" 
    className="with-border"
/>
```

### Upload Interface
The UserRegistration component provides:
- Drag and drop zone
- Click to select from gallery
- File validation
- Preview functionality
- Base64 conversion

## Usage Examples

### Uploading an Avatar
```jsx
// In UserRegistration.jsx
const handleFileSelect = (file) => {
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
        setError(validation.error);
        return;
    }
    
    fileToBase64(file).then(base64Data => {
        // Send base64Data to server
        setAvatarData(base64Data);
    });
};
```

### Displaying an Avatar
```jsx
// In any component
import Avatar from './components/Avatar';

<Avatar userId={user.auth0Id} size={48} />
```

### Fetching Avatar Data
```jsx
// Direct API call
const avatarUrl = `${API_BASE_URL}/api/user/avatar/${userId}`;
<img src={avatarUrl} alt="User avatar" />
```

## Security Considerations

1. **File Size Limits**: 5MB maximum to prevent abuse
2. **File Type Validation**: Only JPG/PNG allowed
3. **Base64 Validation**: Ensures proper data URL format
4. **Authentication**: Upload requires Auth0 JWT
5. **Caching**: 1-year cache for performance

## Performance Considerations

1. **Base64 Overhead**: ~33% larger than binary storage
2. **Database Size**: Monitor avatar field sizes
3. **Caching**: Avatars are cached for 1 year
4. **CDN**: Consider CDN for production scaling

## Migration Notes

- Existing URL-based avatars will continue to work (redirect)
- New uploads will be stored as base64 data
- No database schema changes required
- Backward compatible with existing avatar URLs 