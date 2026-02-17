import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import KegiatanRT from './pages/KegiatanRT';
import MutasiKas from './pages/MutasiKas';
import InputData from './pages/InputData';
import InputIuran from './pages/InputIuran'; // Import file baru

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

  const role = user.role;
  const isDawis = role.startsWith('dawis');
  const isBendahara = role === 'bendahara' || role === 'ketua';
  const isSekretaris = role === 'sekretaris' || role === 'ketua';

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f0f2f5' }}>
      <header style={{ background: '#1a252f', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>SIMAKARTI RT 03 RW 03</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <small>{user.username} ({role})</small>
          <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Keluar</button>
        </div>
      </header>

      <nav style={{ background: 'white', padding: '10px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, zIndex: 10 }}>
        <button style={navBtn(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>🏠 Dash</button>
        <button style={navBtn(activeTab === 'kas')} onClick={() => setActiveTab('kas')}>💰 Kas</button>
        
        {/* Menu Input Iuran untuk Dawis & Bendahara */}
        {(isDawis || isBendahara) && (
          <button style={navBtn(activeTab === 'iuran')} onClick={() => setActiveTab('iuran')}>📥 Input Iuran</button>
        )}
        
        <button style={navBtn(activeTab === 'warga')} onClick={() => setActiveTab('warga')}>👥 Warga</button>
        <button style={navBtn(activeTab === 'kegiatan')} onClick={() => setActiveTab('kegiatan')}>📅 Absen</button>
        
        {isSekretaris && (
          <button style={navBtn(activeTab === 'master')} onClick={() => setActiveTab('master')}>⚙️ Master</button>
        )}
      </nav>

      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'kas' && <MutasiKas user={user} />}
        {activeTab === 'iuran' && <InputIuran user={user} />}
        {activeTab === 'warga' && <DataWarga role={role} />}
        {activeTab === 'kegiatan' && <KegiatanRT role={role} />}
        {activeTab === 'master' && <InputData user={user} />}
      </main>
    </div>
  );
}

const navBtn = (active) => ({
  padding: '8px 15px',
  borderRadius: '20px',
  border: active ? 'none' : '1px solid #ccc',
  background: active ? '#3498db' : 'white',
  color: active ? 'white' : '#333',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  fontSize: '13px',
  fontWeight: active ? 'bold' : 'normal'
});

export default App;
