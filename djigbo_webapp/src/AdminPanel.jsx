import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './AdminPanel.css';

const AdminPanel = () => {
    const [activeView, setActiveView] = useState('main');
    const [tableData, setTableData] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { getAccessTokenSilently } = useAuth0();

    const fetchTableData = async (tableName) => {
        setLoading(true);
        setError(null);
        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/${tableName}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${tableName} data`);
            }

            const data = await response.json();
            setTableData(prev => ({
                ...prev,
                [tableName]: data.data
            }));
        } catch (err) {
            setError(`Error fetching ${tableName}: ${err.message}`);
            console.error(`Error fetching ${tableName}:`, err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDatabaseTables = () => {
        setActiveView('database-tables');
        // Fetch all table data when entering the view
        const tables = ['conversation-summaries', 'feedback', 'users', 'mood-entries', 'mood-stats'];
        tables.forEach(table => fetchTableData(table));
    };

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
        setTableData({});
        setError(null);
    };



    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return 'N/A';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const renderTable = (tableName, data, columns) => (
        <div className="admin-table-container" key={tableName}>
            <h3 className="admin-table-title">{tableName.replace('-', ' ').toUpperCase()}</h3>
            <div className="admin-table-info">
                <span>Total records: {data?.length || 0}</span>
            </div>
            {data && data.length > 0 ? (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                {columns.map(column => (
                                    <th key={column.key}>{column.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((row, index) => (
                                <tr key={index}>
                                    {columns.map(column => (
                                        <td key={column.key}>
                                            {column.format ? column.format(row[column.key]) : row[column.key] || 'N/A'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="admin-table-empty">No data available</p>
            )}
        </div>
    );

    const renderMainView = () => (
        <div className="admin-main-view">
            <div className="admin-header-main">
                <div className="admin-title-section">
                    <h1 className="admin-title">Administravimas</h1>
                    <div className="admin-subtitle">Sistemos valdymas ir stebėjimas</div>
                </div>
            </div>
            <div className="admin-buttons-container">
                <button
                    className="admin-button database-tables-btn"
                    onClick={handleViewDatabaseTables}
                >
                    Duomenų bazės lentelės
                </button>
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

    const renderDatabaseTablesView = () => (
        <div className="admin-content-view">
            <div className="admin-header">
                <button className="back-button" onClick={handleBackToMain}>
                    ← Grįžti
                </button>
                <h2>Duomenų bazės lentelės</h2>
            </div>
            <div className="admin-content">
                {loading && <div className="admin-loading">Kraunama...</div>}
                {error && <div className="admin-error">Klaida: {error}</div>}

                {renderTable('conversation-summaries', tableData['conversation-summaries'], [
                    { key: 'id', label: 'ID' },
                    { key: 'user_id', label: 'Vartotojo ID' },
                    { key: 'conversation_id', label: 'Pokalbio ID' },
                    { key: 'summary', label: 'Santrauka', format: truncateText },
                    { key: 'message_count', label: 'Žinučių skaičius' },
                    { key: 'created_at', label: 'Sukurta', format: formatDate },
                    { key: 'updated_at', label: 'Atnaujinta', format: formatDate }
                ])}

                {renderTable('feedback', tableData['feedback'], [
                    { key: 'id', label: 'ID' },
                    { key: 'user_id', label: 'Vartotojo ID' },
                    { key: 'feedback_text', label: 'Atsiliepimas', format: truncateText },
                    { key: 'created_at', label: 'Sukurta', format: formatDate }
                ])}

                {renderTable('users', tableData['users'], [
                    { key: 'id', label: 'ID' },
                    { key: 'auth0_user_id', label: 'Auth0 ID' },
                    { key: 'nickname', label: 'Slapyvardis' },
                    { key: 'avatar', label: 'Avataras', format: (val) => val ? 'Taip' : 'Ne' },
                    { key: 'created_at', label: 'Sukurta', format: formatDate },
                    { key: 'updated_at', label: 'Atnaujinta', format: formatDate }
                ])}

                {renderTable('mood-entries', tableData['mood-entries'], [
                    { key: 'id', label: 'ID' },
                    { key: 'user_id', label: 'Vartotojo ID' },
                    { key: 'mood_score', label: 'Nuotaikos balas' },
                    { key: 'thoughts', label: 'Mintys', format: truncateText },
                    { key: 'created_at', label: 'Sukurta', format: formatDate },
                    { key: 'updated_at', label: 'Atnaujinta', format: formatDate }
                ])}

                {renderTable('mood-stats', tableData['mood-stats'], [
                    { key: 'id', label: 'ID' },
                    { key: 'date', label: 'Data' },
                    { key: 'avg_mood', label: 'Vidutinė nuotaika' },
                    { key: 'participant_count', label: 'Dalyvių skaičius' },
                    { key: 'common_thoughts', label: 'Bendros mintys', format: truncateText },
                    { key: 'created_at', label: 'Sukurta', format: formatDate },
                    { key: 'updated_at', label: 'Atnaujinta', format: formatDate }
                ])}
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
        <div className={`admin-panel ${activeView === 'database-tables' ? 'database-view' : ''}`}>
            {activeView === 'main' && renderMainView()}
            {activeView === 'database-tables' && renderDatabaseTablesView()}
            {activeView === 'conversations' && renderConversationsView()}
            {activeView === 'sensitive-topics' && renderSensitiveTopicsView()}
            {activeView === 'users-needing-help' && renderUsersNeedingHelpView()}
        </div>
    );
};

export default AdminPanel; 