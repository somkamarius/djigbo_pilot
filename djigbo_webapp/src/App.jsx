import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react';
import IndividualConnection from './IndividualConnection'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react';
import { Maintenance } from './maintenance/Maintenance';
import { Loading } from './maintenance/Loading';
import ConversationBookmark from './ConversationBookmark';
import ClimateNavigationButton from './ClimateNavigationButton';
import LogoutButton from './LogoutButton';
import AdminPanel from './AdminPanel';
import { Climate } from './climate';
// import FeedbackWidget from './FeedbackWidget';

function Storyteller() {
  return <div><h2>Storyteller</h2><p>Educational content in a narrative style.</p></div>;
}

function Democracy() {
  return <div><h2>Class Democracy</h2><p>Ideas, problems, and democratic tools for the class.</p></div>;
}

function App() {
  // const location = useLocation();
  const { isAuthenticated, isLoading, error } = useAuth0();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event) => {
      console.log(event);
      // Check for Option+Shift+D (Mac) or Alt+Shift+D (Windows/Linux)
      if ((event.altKey) && event.shiftKey && event.key === 'Î') {
        event.preventDefault();
        setShowAdminPanel(prev => !prev);
      }

      // Close admin panel with Escape key
      if (event.key === 'Escape') {
        setShowAdminPanel(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId);
    // Show a notification that conversation was selected
    // Note: The backend only stores summaries, not full conversation messages
    console.log('Selected conversation:', conversationId);
    alert(`Conversation ${conversationId} selected. Note: Full conversation messages are not stored for privacy reasons.`);
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  console.log(isAuthenticated);

  return (
    <div className="App">
      {/* <div className="circle-nav" style={{ marginBottom: 0, marginTop: 32 }}>
        <Link to="/" className={`circle-link${location.pathname === '/' ? ' active' : ''}`}>Džigbo Empatijos chatbotas</Link>
        <Link to="/storyteller" className={`circle-link${location.pathname === '/storyteller' ? ' active' : ''}`}>Empatijos Ratas</Link>
        <Link to="/democracy" className={`circle-link${location.pathname === '/democracy' ? ' active' : ''}`}>Kita Funkcija</Link>
      </div> */}
      <ConversationBookmark
        onConversationSelect={handleConversationSelect}
        selectedConversationId={selectedConversationId}
      />
      <ClimateNavigationButton />
      <LogoutButton />
      <div className="main-content-area">
        <div style={{ marginTop: 32 }}>
          <Routes>
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/chat" replace /> : <Navigate to="/maintenance" replace />
            } />
            <Route path="/chat" element={
              isAuthenticated ? <IndividualConnection /> : <Navigate to="/maintenance" replace />
            } />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/storyteller" element={
              isAuthenticated ? <Storyteller /> : <Navigate to="/maintenance" replace />
            } />
            <Route path="/democracy" element={
              isAuthenticated ? <Democracy /> : <Navigate to="/maintenance" replace />
            } />
            <Route path="/climate" element={<Climate />} />
          </Routes>
        </div>
      </div>
      {/* <FeedbackWidget /> */}

      {showAdminPanel && (
        <div className="admin-modal-overlay">
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        </div>
      )}
    </div>
  )
}

export default App
