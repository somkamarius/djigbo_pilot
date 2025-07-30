import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './ConversationBookmark.css';

const ConversationBookmark = ({ onConversationSelect, selectedConversationId }) => {
    const { getAccessTokenSilently, isAuthenticated } = useAuth0();
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const fetchConversations = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        setError(null);

        try {
            const token = await getAccessTokenSilently();
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/conversations`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch conversations');
            }

            const data = await response.json();
            setConversations(data.conversations || []);
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, [isAuthenticated]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1;

        if (diffDays === 0) {
            return 'Šiandien'
        }
        if (diffDays === 1) {
            return 'Vakar';
        } else if (diffDays < 7) {
            return `prieš ${diffDays} d.`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `prieš ${weeks} sav.`;
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const truncateSummary = (summary, maxLength = 2000) => {
        if (!summary) return 'No summary available';
        return summary.length > maxLength
            ? summary.substring(0, maxLength) + '...'
            : summary;
    };

    const handleConversationClick = (conversationId) => {
        onConversationSelect(conversationId);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <>
            <div className="conversation-bookmark" onClick={toggleExpanded}>
                <div className="bookmark-header">
                    <div className="bookmark-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                        </svg>
                    </div>
                    <span className="bookmark-title">Istorija</span>
                    <div className="bookmark-count">{conversations.length}</div>
                </div>
            </div>

            {isExpanded && (
                <div className="bookmark-modal-overlay" onClick={toggleExpanded}>
                    <div className="bookmark-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="bookmark-modal-header">
                            <h3>Pokalbių santraukos</h3>
                            <button className="close-button" onClick={toggleExpanded}>
                                X
                            </button>
                        </div>

                        <div className="bookmark-modal-content">
                            {loading && (
                                <div className="bookmark-loading">
                                    <div className="loading-spinner"></div>
                                    <span>Kraunamos pokalbių santraukos...</span>
                                </div>
                            )}

                            {error && (
                                <div className="bookmark-error">
                                    <span>{error}</span>
                                    <button onClick={fetchConversations} className="retry-button">
                                        Bandyti dar kartą
                                    </button>
                                </div>
                            )}

                            {!loading && !error && conversations.length === 0 && (
                                <div className="bookmark-empty">
                                    <span>Jokių pokalbių nerasta</span>
                                    <p>Pradėkite naują pokalbį, kad matytumėte jų santraukas čia</p>
                                </div>
                            )}

                            {!loading && !error && conversations.length > 0 && (
                                <div className="conversation-list">
                                    {conversations.map((conversation) => (
                                        <div
                                            key={conversation.conversation_id}
                                            className={`conversation-item ${selectedConversationId === conversation.conversation_id ? 'selected' : ''
                                                }`}
                                            onClick={() => handleConversationClick(conversation.conversation_id)}
                                        >
                                            <div className="conversation-date">
                                                {formatDate(conversation.updated_at)}
                                            </div>
                                            <div className="conversation-summary">
                                                {truncateSummary(conversation.summary)}
                                            </div>
                                            <div className="conversation-meta">
                                                <span className="message-count">
                                                    {conversation.message_count || 0} žinutės
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ConversationBookmark; 