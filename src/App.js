import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import MutasiKas from './pages/MutasiKas';
import InputIuran from './pages/InputIuran';
import Approval from './pages/Approval';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('simakarti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('simakarti_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simakarti_user');
    setActiveTab('dashboard');
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const isDawis = user.role.startsWith('dawis');
  const isBendahara = user.role === 'bendahara';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#1a252f', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>SIMAKARTI 03</h3>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.username}</div>
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#e74c3c', padding: 0, cursor: 'pointer', fontSize: '12px' }}>Keluar</button>
        </div>
      </header>

      <nav style={{ background: 'white', padding: '10px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #ddd', sticky: 'top', zIndex: 100 }}>
        <button style={navBtn(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>🏠 Dash</button>
        <button style={navBtn(activeTab === 'kas')} onClick={() => setActiveTab('kas')}>💰 Kas Riil</button>
        
        {/* Menu Dinamis Berdasarkan Role */}
        {(isDawis || isBendahara) && (
          <button style={navBtn(activeTab === 'iuran')} onClick={() => setActiveTab('iuran')}>📝 Input Iuran</button>
        )}
        
        {isBendahara && (
          <button style={navBtn(activeTab === 'approve')} onClick={() => setActiveTab('approve')}>✅ Approval</button>
        )}

        <button style={navBtn(activeTab === 'warga')} onClick={() => setActiveTab('warga')}>👥 Warga</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'kas' && <MutasiKas user={user} />}
        {activeTab === 'iuran' && <InputIuran user={user} />}
        {activeTab === 'approve' && <Approval user={user} />}
        {activeTab === 'warga' && <DataWarga role={user.role} />}
      </main>
    </div>
  );
}

const navBtn = (active) => ({
  padding: '8px 15px',
  borderRadius: '20px',
  border: 'none',
  background: active ? '#3498db' : '#eee',
  color: active ? 'white' : '#555',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontSize: '13px',
  fontWeight: active ? 'bold' : 'normal',
  transition: 'all 0.3s'
});

export default App;
