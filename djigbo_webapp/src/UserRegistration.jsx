import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './UserRegistration.css';

const UserRegistration = ({ onRegistrationComplete }) => {
    const { user } = useAuth0();
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Function to validate URL format
    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate avatar URL if provided
        const trimmedAvatar = avatar.trim();
        if (trimmedAvatar && !isValidUrl(trimmedAvatar)) {
            setError('Please enter a valid URL for the avatar');
            setIsLoading(false);
            return;
        }

        try {
            const token = await getAccessTokenSilently();

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nickname: nickname.trim(),
                    avatar: trimmedAvatar || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            const result = await response.json();
            console.log('User registered successfully:', result);

            // Call the callback to proceed with the flow
            onRegistrationComplete();
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const { getAccessTokenSilently } = useAuth0();

    return (
        <div className="user-registration">
            <div className="registration-container">
                <h1>Welcome to Džigbo!</h1>
                <p>Please complete your profile to continue</p>

                <form onSubmit={handleSubmit} className="registration-form">
                    <div className="form-group">
                        <label htmlFor="nickname">Nickname *</label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter your nickname"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="avatar">Avatar URL (optional)</label>
                        <input
                            type="text"
                            id="avatar"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                            placeholder="https://example.com/avatar.jpg"
                            disabled={isLoading}
                        />
                        <small>Provide a URL to your profile picture</small>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="submit-button"
                        disabled={isLoading || !nickname.trim()}
                    >
                        {isLoading ? 'Creating Profile...' : 'Complete Registration'}
                    </button>
                </form>

                <div className="user-info">
                    <p>Logged in as: {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default UserRegistration; 