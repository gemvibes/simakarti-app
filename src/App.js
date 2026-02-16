import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import InputData from './pages/InputData';

function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('dashboard');

  if (!session) return <Login onLogin={setSession} />;

  const isWarga = session.role === 'warga';
  const isHumas = session.role === 'humas';
  const canInput = !isWarga && !isHumas;

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', backgroundColor: '#fff', minHeight: '100vh' }}>
      <header style={{ padding: '20px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>SIMAKARTI</h2>
        <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold', color: '#7f8c8d' }}>SISTEM INFORMASI MANAJEMEN KAS RT TIGA</p>
      </header>

      <nav style={{ display: 'flex', background: '#2c3e50' }}>
        <button onClick={() => setTab('dashboard')} style={navS}>DASHBOARD</button>
        <button onClick={() => setTab('warga')} style={navS}>WARGA</button>
        {canInput && <button onClick={() => setTab('input')} style={navS}>INPUT</button>}
        <button onClick={() => setSession(null)} style={{ ...navS, background: '#c0392b' }}>OUT</button>
      </nav>

      <div style={{ padding: '20px' }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'warga' && <DataWarga />}
        {tab === 'input' && canInput && <InputData role={session.role} />}
      </div>
    </div>
  );
}

const navS = { flex: 1, padding: '15px 5px', border: 'none', background: 'none', color: 'white', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' };

export default App;
