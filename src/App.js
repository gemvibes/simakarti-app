import React, { useState, useEffect } from 'react';
// Pastikan nama file di folder 'pages' sama persis ejaannya dengan ini
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import KegiatanRT from './pages/KegiatanRT';
import MutasiKas from './pages/MutasiKas';
import InputData from './pages/InputData';
import InputToko from './pages/InputToko';

function App() {
  // Simpan sesi login di browser
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

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Hak Akses
  const role = user.role;
  const isPengurus = role === 'ketua' || role === 'sekretaris' || role === 'bendahara' || role === 'humas' || role.includes('dawis');

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f0f2f5' }}>
      
      {/* HEADER */}
      <header style={{ background: '#1a252f', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>SIMAKARTI RT 03</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <small>{user.username} ({role})</small>
          <button onClick={handleLogout} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Keluar</button>
        </div>
      </header>

      {/* NAVIGASI */}
      <nav style={{ background: 'white', padding: '10px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #ddd' }}>
        <button style={navBtn(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>🏠 Dashboard</button>
        <button style={navBtn(activeTab === 'kas')} onClick={() => setActiveTab('kas')}>💰 Keuangan</button>
        <button style={navBtn(activeTab === 'warga')} onClick={() => setActiveTab('warga')}>👥 Warga</button>
        <button style={navBtn(activeTab === 'kegiatan')} onClick={() => setActiveTab('kegiatan')}>📅 Absensi</button>
        <button style={navBtn(activeTab === 'toko')} onClick={() => setActiveTab('toko')}>🏪 UMKM</button>
        {isPengurus && <button style={navBtn(activeTab === 'input')} onClick={() => setActiveTab('input')}>📝 Input Master</button>}
      </nav>

      {/* KONTEN */}
      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'kas' && <MutasiKas user={user} />}
        {activeTab === 'warga' && <DataWarga role={role} />}
        {activeTab === 'kegiatan' && <KegiatanRT role={role} />}
        {activeTab === 'toko' && <InputToko user={user} viewOnly={role === 'warga'} />}
        {activeTab === 'input' && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h4>Menu Input Master (Pengurus)</h4>
            <InputData user={user} />
          </div>
        )}
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
  fontWeight: active ? 'bold' : 'normal'
});

export default App;
