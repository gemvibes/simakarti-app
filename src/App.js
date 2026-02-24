import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import DataToko from './pages/DataToko';
import MutasiKas from './pages/MutasiKas';
import InputIuran from './pages/InputIuran';
import Approval from './pages/Approval';
import KegiatanRT from './pages/KegiatanRT';
import InputIuranToko from './pages/InputIuranToko';

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('simakarti_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return (
    <Login onLogin={(u) => {
      setUser(u);
      localStorage.setItem('simakarti_user', JSON.stringify(u));
    }} />
  );

  const isDawis     = user.role.startsWith('dawis');
  const isBendahara = user.role === 'bendahara';
  const isHumas     = user.role === 'humas';
  const isAdmin     = ['ketua', 'sekretaris'].includes(user.role);

  const getRoleLabel = (role) => {
    const map = { ketua: 'Ketua RT', sekretaris: 'Sekretaris', bendahara: 'Bendahara', humas: 'Humas', warga: 'Warga' };
    if (map[role]) return map[role];
    if (role.startsWith('dawis')) {
      const n = role.replace('dawis', '');
      const r = { 1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI' };
      return `Dawis ${r[parseInt(n)] || n}`;
    }
    return role.toUpperCase();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f6', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER ── */}
      <header style={{
        background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
        color: 'white', padding: '0 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 12px rgba(15,118,110,0.3)',
        minHeight: '60px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <span style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '1.5px' }}>SIMAKARTI</span>
          <span style={{ fontSize: '10px', opacity: 0.85, letterSpacing: '0.3px', marginTop: '1px' }}>
            Sistem Informasi Manajemen Kas RT Tiga
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{user.username.toUpperCase()}</div>
          <div style={{ fontSize: '11px', opacity: 0.8 }}>{getRoleLabel(user.role)}</div>
          <button
            onClick={() => { setUser(null); localStorage.removeItem('simakarti_user'); }}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', cursor: 'pointer', fontSize: '11px', padding: '2px 10px', borderRadius: '12px', marginTop: '3px' }}
          >
            Keluar
          </button>
        </div>
      </header>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: 'white', padding: '10px 12px',
        display: 'flex', gap: '6px', overflowX: 'auto',
        borderBottom: '2px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <NavBtn label="🏠 Dashboard"  active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavBtn label="💰 Kas"        active={activeTab === 'kas'}       onClick={() => setActiveTab('kas')} />
        {isDawis     && <NavBtn label="📝 Iuran Warga" active={activeTab === 'iuran'}    onClick={() => setActiveTab('iuran')} />}
        {isHumas     && <NavBtn label="🧾 Iuran Toko"  active={activeTab === 'iurantoko'} onClick={() => setActiveTab('iurantoko')} />}
        {isBendahara && <NavBtn label="✅ Approval"    active={activeTab === 'approve'}  onClick={() => setActiveTab('approve')} />}
        {/* Data Warga — semua kecuali dawis & warga */}
        {!isDawis && user.role !== 'warga' && (
          <NavBtn label="👥 Data Warga" active={activeTab === 'warga'} onClick={() => setActiveTab('warga')} />
        )}
        {/* Data Toko — semua akun bisa lihat */}
        <NavBtn label="🏪 Data Toko"  active={activeTab === 'datatoko'} onClick={() => setActiveTab('datatoko')} />
        <NavBtn label="📅 Kegiatan"   active={activeTab === 'kegiatan'} onClick={() => setActiveTab('kegiatan')} />
      </nav>

      {/* ── KONTEN ── */}
      <main style={{ padding: '20px' }}>
        {activeTab === 'dashboard'  && <Dashboard user={user} setActiveTab={setActiveTab} />}
        {activeTab === 'kas'        && <MutasiKas user={user} />}
        {activeTab === 'iuran'      && <InputIuran user={user} />}
        {activeTab === 'iurantoko'  && <InputIuranToko user={user} />}
        {activeTab === 'approve'    && <Approval user={user} />}
        {activeTab === 'warga'      && <DataWarga user={user} />}
        {activeTab === 'datatoko'   && <DataToko user={user} />}
        {activeTab === 'kegiatan'   && <KegiatanRT user={user} />}
      </main>
    </div>
  );
}

const NavBtn = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '9px 16px', borderRadius: '20px', border: 'none',
      background: active ? '#0f766e' : '#f1f5f9',
      color: active ? 'white' : '#64748b',
      cursor: 'pointer', whiteSpace: 'nowrap',
      fontSize: '13px', fontWeight: '600',
      transition: 'all 0.15s'
    }}
  >
    {label}
  </button>
);

export default App;
