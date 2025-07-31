import React, { useState } from 'react';
import { getAvatarUrl } from '../utils/avatarUtils';
import './Avatar.css';

/**
 * Avatar component for displaying user avatars
 * @param {Object} props
 * @param {string} props.userId - The user's Auth0 ID
 * @param {string} props.fallbackUrl - Optional fallback URL for default avatar
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.size - Size in pixels (default: 40)
 * @param {string} props.alt - Alt text for the image
 */
const Avatar = ({
    userId,
    fallbackUrl = '/default-avatar.png',
    className = '',
    size = 40,
    alt = 'User avatar'
}) => {
    const [imageError, setImageError] = useState(false);

    const avatarUrl = getAvatarUrl(userId, fallbackUrl);
    const finalUrl = imageError ? fallbackUrl : avatarUrl;

    const handleImageError = () => {
        if (!imageError) {
            setImageError(true);
        }
    };

    return (
        <img
            src={finalUrl}
            alt={alt}
            className={`avatar ${className}`}
            style={{ width: size, height: size }}
            onError={handleImageError}
        />
    );
};

export default Avatar; 