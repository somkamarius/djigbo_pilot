import { useNavigate } from 'react-router-dom';
import './LogoutButton.css';

const LogoutButton = () => {
    const navigate = useNavigate();

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <button onClick={handleProfileClick} className="logout-button">
            <div className="logout-button-header">
                <div className="logout-button-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
                <span className="logout-button-title">Profile</span>
                <div className="logout-button-indicator">→</div>
            </div>
        </button>
    );
};

export default LogoutButton; 