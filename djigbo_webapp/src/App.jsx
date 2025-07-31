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
import UserRegistration from './UserRegistration';
// import FeedbackWidget from './FeedbackWidget';

function Storyteller() {
  return <div><h2>Storyteller</h2><p>Educational content in a narrative style.</p></div>;
}

function Democracy() {
  return <div><h2>Class Democracy</h2><p>Ideas, problems, and democratic tools for the class.</p></div>;
}

function App() {
  // const location = useLocation();
  const { isAuthenticated, isLoading, error, getAccessTokenSilently } = useAuth0();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [userExists, setUserExists] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);

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

  // Check if user exists in our database when authenticated
  useEffect(() => {
    const checkUserExists = async () => {
      if (!isAuthenticated) {
        setUserExists(null);
        return;
      }

      setCheckingUser(true);
      try {
        const token = await getAccessTokenSilently();
        const response = await fetch('/api/user/check', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserExists(data.exists);
        } else {
          console.error('Failed to check user existence');
          setUserExists(false);
        }
      } catch (error) {
        console.error('Error checking user existence:', error);
        setUserExists(false);
      } finally {
        setCheckingUser(false);
      }
    };

    checkUserExists();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId);
    // Show a notification that conversation was selected
    // Note: The backend only stores summaries, not full conversation messages
    console.log('Selected conversation:', conversationId);
    alert(`Conversation ${conversationId} selected. Note: Full conversation messages are not stored for privacy reasons.`);
  };

  const handleRegistrationComplete = () => {
    setUserExists(true);
  };

  if (isLoading || checkingUser) {
    return <Loading />;
  }

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  // Show registration screen if user is authenticated but doesn't exist in our database
  if (isAuthenticated && userExists === false) {
    return <UserRegistration onRegistrationComplete={handleRegistrationComplete} />;
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
            <Route path="/register" element={
              isAuthenticated ? <UserRegistration onRegistrationComplete={handleRegistrationComplete} /> : <Navigate to="/maintenance" replace />
            } />
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
