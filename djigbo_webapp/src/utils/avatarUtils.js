/**
 * Utility functions for handling avatars
 */

/**
 * Get avatar URL for a user
 * @param {string} userId - The user's Auth0 ID
 * @param {string} fallbackUrl - Optional fallback URL if user has no avatar
 * @returns {string} The avatar URL or fallback
 */
export const getAvatarUrl = (userId, fallbackUrl = null) => {
    if (!userId) {
        return fallbackUrl || '/default-avatar.png';
    }

    return `${import.meta.env.VITE_API_BASE_URL}/api/user/avatar/${userId}`;
};

/**
 * Create a base64 data URL from a file
 * @param {File} file - The file to convert
 * @returns {Promise<string>} The base64 data URL
 */
export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Validate file for avatar upload
 * @param {File} file - The file to validate
 * @returns {Object} Validation result with valid boolean and error message
 */
export const validateAvatarFile = (file) => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Pasirinkite JPG arba PNG failą'
        };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'Failo dydis negali viršyti 5MB'
        };
    }

    return { valid: true };
}; 