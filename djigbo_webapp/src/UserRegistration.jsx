import React, { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { validateAvatarFile, fileToBase64 } from './utils/avatarUtils';
import './UserRegistration.css';

const UserRegistration = ({ onRegistrationComplete }) => {
    const { user } = useAuth0();
    const [nickname, setNickname] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Function to handle file selection
    const handleFileSelect = (file) => {
        const validation = validateAvatarFile(file);
        if (!validation.valid) {
            setError(validation.error);
            return;
        }

        setAvatarFile(file);
        fileToBase64(file).then(base64Data => {
            setAvatarPreview(base64Data);
            setError('');
        }).catch(err => {
            setError('Klaida apdorojant failą');
            console.error('File processing error:', err);
        });
    };

    // Function to handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Function to handle gallery selection
    const handleGallerySelect = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const token = await getAccessTokenSilently();

            // Prepare avatar data
            let avatarData = null;
            if (avatarFile) {
                // Convert file to base64 for upload
                const reader = new FileReader();
                avatarData = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(avatarFile);
                });
            }

            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/user/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nickname: nickname.trim(),
                    avatar: avatarData
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registracija nepavyko');
            }

            const result = await response.json();
            console.log('User registered successfully:', result);

            // Call the callback to proceed with the flow
            onRegistrationComplete();
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registracija nepavyko. Bandykite dar kartą.');
        } finally {
            setIsLoading(false);
        }
    };

    const { getAccessTokenSilently } = useAuth0();

    return (
        <div className="user-registration">
            <div className="registration-container">
                <h1>Sveiki atvykę į Džigbo!</h1>
                <p>Prašome užpildyti savo profilį, kad galėtumėte tęsti</p>

                <form onSubmit={handleSubmit} className="registration-form">
                    <div className="form-group">
                        <label htmlFor="nickname">Vardas *</label>
                        <input
                            type="text"
                            id="nickname"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Įveskite savo vardą"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label>Avataras (neprivaloma)</label>

                        {/* Avatar Preview */}
                        {avatarPreview && (
                            <div className="avatar-preview">
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="avatar-image"
                                />
                                <button
                                    type="button"
                                    className="remove-avatar"
                                    onClick={() => {
                                        setAvatarPreview('');
                                        setAvatarFile(null);
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        {/* Avatar Upload Options */}
                        <div className="avatar-upload-options">
                            {/* Drag and Drop Area */}
                            <div
                                className={`drag-drop-area ${isDragOver ? 'drag-over' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={handleGallerySelect}
                            >
                                <div className="drag-drop-content">
                                    <span>📁 Spustelėkite arba nuvilkite paveikslėlį čia</span>
                                    <small>Palaikomi formatai: JPG, PNG (maks. 5MB)</small>
                                </div>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => handleFileSelect(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
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
                        {isLoading ? 'Kuriamas profilis...' : 'Užbaigti registraciją'}
                    </button>
                </form>

                <div className="user-info">
                    <p>Prisijungta paštu: {user?.email}</p>
                </div>
            </div>
        </div>
    );
};

export default UserRegistration; 