import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import MutasiKas from './pages/MutasiKas';
import InputIuran from './pages/InputIuran';
import Approval from './pages/Approval';
import KegiatanRT from './pages/KegiatanRT';
import InputIuranToko from './pages/InputIuranToko';
import RekapIuran from './pages/RekapIuran';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('simakarti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return <Login onLogin={(u) => { setUser(u); localStorage.setItem('simakarti_user', JSON.stringify(u)); }} />;

  // Identifikasi Role
  const isDawis = user.role.startsWith('dawis');
  const isBendahara = user.role === 'bendahara';
  const isKetua = user.role === 'ketua';
  const isSekretaris = user.role === 'sekretaris';
  const isHumas = user.role === 'humas';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#1a252f', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>SIMAKARTI 03</h3>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user.username.toUpperCase()}</div>
          <button onClick={() => { setUser(null); localStorage.removeItem('simakarti_user'); }} style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '12px', padding: 0 }}>Keluar</button>
        </div>
      </header>

      <nav style={{ background: 'white', padding: '10px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #ddd', position: 'sticky', top: 0, zIndex: 100 }}>
        <button style={navBtn(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>🏠 Dash</button>
        <button style={navBtn(activeTab === 'kas')} onClick={() => setActiveTab('kas')}>💰 Kas</button>

        {/* Menu Khusus Dawis */}
        {isDawis && <button style={navBtn(activeTab === 'iuran')} onClick={() => setActiveTab('iuran')}>📝 Iuran Warga</button>}

        {/* Menu Khusus Humas */}
        {isHumas && <button style={navBtn(activeTab === 'toko')} onClick={() => setActiveTab('toko')}>🏪 Iuran Toko</button>}

        {/* Menu Khusus Bendahara */}
        {isBendahara && <button style={navBtn(activeTab === 'approve')} onClick={() => setActiveTab('approve')}>✅ Approval</button>}

        {/* Rekap Iuran: Bendahara, Ketua, Sekretaris */}
        {(isBendahara || isKetua || isSekretaris) && (
          <button style={navBtn(activeTab === 'rekap')} onClick={() => setActiveTab('rekap')}>📊 Rekap Iuran</button>
        )}

        {/* Menu Umum */}
        <button style={navBtn(activeTab === 'warga')} onClick={() => setActiveTab('warga')}>👥 Warga</button>
        <button style={navBtn(activeTab === 'kegiatan')} onClick={() => setActiveTab('kegiatan')}>📅 Kegiatan</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'kas' && <MutasiKas user={user} />}
        {activeTab === 'iuran' && <InputIuran user={user} />}
        {activeTab === 'toko' && <InputIuranToko user={user} />}
        {activeTab === 'approve' && <Approval user={user} />}
        {activeTab === 'rekap' && <RekapIuran user={user} />}
        {activeTab === 'warga' && <DataWarga user={user} />}
        {activeTab === 'kegiatan' && <KegiatanRT user={user} />}
      </main>
    </div>
  );
}

const navBtn = (act) => ({
  padding: '10px 18px', borderRadius: '25px', border: 'none',
  background: act ? '#3498db' : '#f0f0f0', color: act ? 'white' : '#555',
  cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 'bold'
});

export default App;
