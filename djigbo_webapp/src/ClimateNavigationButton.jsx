import { Link, useLocation } from 'react-router-dom';
import './ClimateNavigationButton.css';

const ClimateNavigationButton = () => {
    const location = useLocation();
    const isOnClimatePage = location.pathname === '/climate';

    if (isOnClimatePage) {
        // Show Chat button when on Climate page
        return (
            <Link to="/chat" className="climate-navigation-button">
                <div className="climate-button-header">
                    <div className="climate-button-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                        </svg>
                    </div>
                    <span className="climate-button-title">Chat</span>
                    <div className="climate-button-indicator">→</div>
                </div>
            </Link>
        );
    }

    // Show Climate button when on other pages
    return (
        <Link to="/climate" className="climate-navigation-button">
            <div className="climate-button-header">
                <div className="climate-button-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <span className="climate-button-title">Climate</span>
                <div className="climate-button-indicator">→</div>
            </div>
        </Link>
    );
};

export default ClimateNavigationButton; 