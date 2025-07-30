import React, { useState } from 'react';
import './AdminPanel.css';

const AdminPanel = ({ onClose }) => {
    const [activeView, setActiveView] = useState('main');

    const handleViewConversations = () => {
        setActiveView('conversations');
        console.log('Viewing conversations...');
        // TODO: Implement conversation viewing logic
    };

    const handleViewSensitiveTopics = () => {
        setActiveView('sensitive-topics');
        console.log('Viewing sensitive topics...');
        // TODO: Implement sensitive topics viewing logic
    };

    const handleViewUsersNeedingHelp = () => {
        setActiveView('users-needing-help');
        console.log('Viewing users who need help...');
        // TODO: Implement users needing help viewing logic
    };

    const handleBackToMain = () => {
        setActiveView('main');
    };

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const renderMainView = () => (
        <div className="admin-main-view">
            <div className="admin-header-main">
                <div className="admin-title-section">
                    <h1 className="admin-title">Administravimas</h1>
                    <div className="admin-subtitle">Sistemos valdymas ir stebėjimas</div>
                </div>
                <button className="close-button" onClick={handleClose}>
                    ✕
                </button>
            </div>
            <div className="admin-buttons-container">
                <button
                    className="admin-button conversations-btn"
                    onClick={handleViewConversations}
                >
                    Pokalbiai
                </button>
                <button
                    className="admin-button sensitive-topics-btn"
                    onClick={handleViewSensitiveTopics}
                >
                    Jautrios temos
                </button>
                <button
                    className="admin-button users-help-btn"
                    onClick={handleViewUsersNeedingHelp}
                >
                    Kam reikia pakalbėti?
                </button>
            </div>
        </div>
    );

    const renderConversationsView = () => (
        <div className="admin-content-view">
            <div className="admin-header">
                <button className="back-button" onClick={handleBackToMain}>
                    ← Grįžti
                </button>
                <h2>Pokalbiai</h2>
            </div>
            <div className="admin-content">
                <p>Čia bus rodomi visi pokalbiai...</p>
                {/* TODO: Add conversation list component */}
            </div>
        </div>
    );

    const renderSensitiveTopicsView = () => (
        <div className="admin-content-view">
            <div className="admin-header">
                <button className="back-button" onClick={handleBackToMain}>
                    ← Grįžti
                </button>
                <h2>Jautrios Temos</h2>
            </div>
            <div className="admin-content">
                <p>Čia bus rodomos jautrios temos...</p>
                {/* TODO: Add sensitive topics component */}
            </div>
        </div>
    );

    const renderUsersNeedingHelpView = () => (
        <div className="admin-content-view">
            <div className="admin-header">
                <button className="back-button" onClick={handleBackToMain}>
                    ← Grįžti
                </button>
                <h2>Vartotojai, kuriems reikia pagalbos</h2>
            </div>
            <div className="admin-content">
                <p>Čia bus rodomi vartotojai, kuriems reikia pagalbos...</p>
                {/* TODO: Add users needing help component */}
            </div>
        </div>
    );

    return (
        <div className="admin-panel">
            {activeView === 'main' && renderMainView()}
            {activeView === 'conversations' && renderConversationsView()}
            {activeView === 'sensitive-topics' && renderSensitiveTopicsView()}
            {activeView === 'users-needing-help' && renderUsersNeedingHelpView()}
        </div>
    );
};

export default AdminPanel; 