import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react';
import IndividualConnection from './IndividualConnection'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react';
import { Maintenance } from './maintenance/Maintenance';
import { Loading } from './maintenance/Loading';
import ConversationBookmark from './ConversationBookmark';
import A2NavigationButton from './A2NavigationButton';
import AdminPanel from './AdminPanel';
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

  if (!isAuthenticated) {
    return <Maintenance />;
  }

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
      <A2NavigationButton />
      <div className="main-content-area">
        <div style={{ marginTop: 32 }}>
          <Routes>
            <Route path="/" element={<IndividualConnection />} />
            <Route path="/storyteller" element={<Storyteller />} />
            <Route path="/democracy" element={<Democracy />} />
            <Route path="/a2" element={<Maintenance />} />
            <Route path="/admin" element={<AdminPanel />} />
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
