import { useAuth0 } from '@auth0/auth0-react';
import './LogoutButton.css';

const LogoutButton = () => {
    const { logout } = useAuth0();

    const handleLogout = () => {
        logout({
            logoutParams: {
                returnTo: window.location.origin
            }
        });
    };

    return (
        <button onClick={handleLogout} className="logout-button">
            <div className="logout-button-header">
                <div className="logout-button-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                    </svg>
                </div>
                <span className="logout-button-title">Logout</span>
                <div className="logout-button-indicator">→</div>
            </div>
        </button>
    );
};

export default LogoutButton; 