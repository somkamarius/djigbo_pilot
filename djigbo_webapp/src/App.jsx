import { Routes, Route, Link, useLocation } from 'react-router-dom'
import IndividualConnection from './IndividualConnection'
import './App.css'

function Storyteller() {
  return <div><h2>Storyteller</h2><p>Educational content in a narrative style.</p></div>;
}

function Democracy() {
  return <div><h2>Class Democracy</h2><p>Ideas, problems, and democratic tools for the class.</p></div>;
}


function App() {
  const location = useLocation();
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
    </div>
  )
}

export default App
