import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import MutasiKas from './pages/MutasiKas';
import InputIuran from './pages/InputIuran';
import Approval from './pages/Approval'; // Jangan lupa buat file ini besok/nanti

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('simakarti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('simakarti_user', JSON.stringify(u)); }} />;

  const isDawis = user.role.startsWith('dawis');
  const isBendahara = user.role === 'bendahara';
  const isKetua = user.role === 'ketua';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#1a252f', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>SIMAKARTI 03</h3>
        <span>{user.username} ({user.role})</span>
      </header>

      <nav style={{ background: 'white', padding: '10px', display: 'flex', gap: '10px', overflowX: 'auto', borderBottom: '1px solid #ddd' }}>
        <button style={navBtn(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>🏠 Dash</button>
        <button style={navBtn(activeTab === 'kas')} onClick={() => setActiveTab('kas')}>💰 Kas Riil</button>
        
        {/* Dawis: Bisa Input Iuran */}
        {isDawis && <button style={navBtn(activeTab === 'iuran')} onClick={() => setActiveTab('iuran')}>📝 Input Iuran</button>}
        
        {/* Bendahara: Bisa Input & Approve */}
        {isBendahara && (
          <>
            <button style={navBtn(activeTab['iuran'])} onClick={() => setActiveTab('iuran')}>📝 Input Iuran</button>
            <button style={navBtn(activeTab === 'approve')} onClick={() => setActiveTab('approve')}>✅ Approval</button>
          </>
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

const navBtn = (act) => ({
  padding: '8px 15px', borderRadius: '20px', border: 'none',
  background: act ? '#3498db' : '#eee', color: act ? 'white' : '#555', cursor: 'pointer', whiteSpace: 'nowrap'
});

export default App;
