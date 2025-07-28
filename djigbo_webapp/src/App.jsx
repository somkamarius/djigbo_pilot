import { Routes, Route, Link, useLocation } from 'react-router-dom'
import IndividualConnection from './IndividualConnection'
import './App.css'
import { useAuth0 } from '@auth0/auth0-react';
import { Maintenance } from './maintenance/Maintenance';
import FeedbackWidget from './FeedbackWidget';

function Storyteller() {
  return <div><h2>Storyteller</h2><p>Educational content in a narrative style.</p></div>;
}

function Democracy() {
  return <div><h2>Class Democracy</h2><p>Ideas, problems, and democratic tools for the class.</p></div>;
}


function App() {
  const location = useLocation();
  const { isAuthenticated, isLoading, error } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
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
      <div className="circle-nav" style={{ marginBottom: 0, marginTop: 32 }}>
        <Link to="/" className={`circle-link${location.pathname === '/' ? ' active' : ''}`}>Džigbo Empatijos chatbotas</Link>
        <Link to="/storyteller" className={`circle-link${location.pathname === '/storyteller' ? ' active' : ''}`}>Empatijos Ratas</Link>
        <Link to="/democracy" className={`circle-link${location.pathname === '/democracy' ? ' active' : ''}`}>Kita Funkcija</Link>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div style={{ marginTop: 32 }}>
          <Routes>
            <Route path="/" element={<IndividualConnection />} />
            <Route path="/storyteller" element={<Storyteller />} />
            <Route path="/democracy" element={<Democracy />} />
          </Routes>
        </div>
      </div>
      <FeedbackWidget />
    </div>
  )
}

export default App
