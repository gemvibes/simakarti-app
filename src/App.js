import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import InputData from './pages/InputData';
import InputToko from './pages/InputToko';
import KegiatanRT from './pages/KegiatanRT'; // Import halaman baru

function App() {
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('dashboard');

  if (!session) return <Login onLogin={setSession} />;

  const role = session.role;
  const isKetua = role === 'ketua';
  const isBendahara = role === 'bendahara';
  const isHumas = role === 'humas';
  const isSekretaris = role === 'sekretaris';
  const isDawis = role.startsWith('dawis');

  // Style Navigasi
  const navBtn = { flex: '1', padding: '12px 5px', border: 'none', background: 'transparent', color: 'white', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer', borderBottom: '3px solid transparent' };
  const activeBtn = { ...navBtn, borderBottom: '3px solid #f1c40f', background: 'rgba(255,255,255,0.1)' };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER */}
      <header style={{ background: '#2c3e50', color: 'white', padding: '15px 20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>SIMAKARTI</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span style={{ fontSize: '10px', opacity: 0.8 }}>RT 03 TIGA - SISTEM TERPADU</span>
          <span style={{ fontSize: '10px', background: '#f1c40f', color: '#2c3e50', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{role.toUpperCase()}</span>
        </div>
      </header>

      {/* NAVIGASI LENGKAP */}
      <nav style={{ display: 'flex', background: '#34495e', overflowX: 'auto' }}>
        <button style={tab === 'dashboard' ? activeBtn : navBtn} onClick={() => setTab('dashboard')}>HOME</button>
        <button style={tab === 'warga' ? activeBtn : navBtn} onClick={() => setTab('warga')}>WARGA</button>
        
        {/* Menu KEGIATAN: Semua bisa lihat, Sekretaris bisa input */}
        <button style={tab === 'kegiatan' ? activeBtn : navBtn} onClick={() => setTab('kegiatan')}>KEGIATAN</button>

        {(isHumas || isBendahara || isKetua) && (
          <button style={tab === 'toko' ? activeBtn : navBtn} onClick={() => setTab('toko')}>UMKM</button>
        )}

        {(isBendahara || isSekretaris || isDawis || isKetua) && (
          <button style={tab === 'input' ? activeBtn : navBtn} onClick={() => setTab('input')}>INPUT</button>
        )}

        <button style={{ ...navBtn, background: '#c0392b', flex: '0 0 40px' }} onClick={() => setSession(null)}>X</button>
      </nav>

      {/* KONTEN UTAMA */}
      <main style={{ flex: '1', padding: '20px' }}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'warga' && <DataWarga />}
        {tab === 'kegiatan' && <KegiatanRT role={role} />}
        {tab === 'toko' && <InputToko role={role} />}
        {tab === 'input' && <InputData role={role} />}
      </main>

      <footer style={{ textAlign: 'center', padding: '15px', fontSize: '10px', color: '#95a5a6', borderTop: '1px solid #eee' }}>
        &copy; 2026 SIMAKARTI RT 03
      </footer>
    </div>
  );
}

export default App;
