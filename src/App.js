import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import InputData from './pages/InputData';
import InputToko from './pages/InputToko';
import KegiatanRT from './pages/KegiatanRT';
import MutasiKas from './pages/MutasiKas'; // Pastikan file ini sudah ada

function App() {
  // 1. Cek User di LocalStorage (Agar tidak logout saat refresh)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('simakarti_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // 2. Fungsi Login
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('simakarti_user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  // 3. Fungsi Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simakarti_user');
    setActiveTab('dashboard');
  };

  // Jika belum login, tampilkan halaman Login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- LOGIKA HAK AKSES ---
  const isKetua = user.role === 'ketua';
  const isSekretaris = user.role === 'sekretaris' || isKetua;
  const isBendahara = user.role === 'bendahara' || isKetua;
  const isHumas = user.role === 'humas' || isKetua;
  const isDawis = user.role.startsWith('dawis');

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", minHeight: '100vh', background: '#f4f7f6' }}>
      
      {/* --- HEADER --- */}
      <header style={{ background: '#1a252f', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>SIMAKARTI 03</h2>
          <span style={{ background: '#34495e', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>v1.0</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: 'right', fontSize: '12px' }}>
            <div style={{ fontWeight: 'bold' }}>{user.username}</div>
            <div style={{ opacity: 0.8 }}>{user.role}</div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ background: '#c0392b', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Keluar
          </button>
        </div>
      </header>

      {/* --- NAVIGASI TAB --- */}
      <nav style={{ background: 'white', padding: '10px 20px', borderBottom: '1px solid #ddd', overflowX: 'auto', display: 'flex', gap: '8px', position: 'sticky', top: 0, zIndex: 100 }}>
        
        {/* 1. Dashboard (Semua) */}
        <button style={btnStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
          🏠 Dashboard
        </button>

        {/* 2. Keuangan (Semua) */}
        <button style={btnStyle(activeTab === 'kas')} onClick={() => setActiveTab('kas')}>
          💰 Keuangan (Kas & KGR)
        </button>

        {/* 3. Data Warga (Semua) */}
        <button style={btnStyle(activeTab === 'warga')} onClick={() => setActiveTab('warga')}>
          👥 Data Warga
        </button>
        
        {/* 4. Kegiatan & Absen (Semua) */}
        <button style={btnStyle(activeTab === 'kegiatan')} onClick={() => setActiveTab('kegiatan')}>
          📅 Kegiatan & Absen
        </button>

        {/* 5. UMKM (Semua) */}
        <button style={btnStyle(activeTab === 'toko')} onClick={() => setActiveTab('toko')}>
          🏪 UMKM Warga
        </button>

        {/* 6. Input Data (Hanya Pengurus) */}
        {(isSekretaris || isBendahara || isHumas || isDawis) && (
          <button style={btnStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>
            📝 Input Master
          </button>
        )}
      </nav>

      {/* --- KONTEN UTAMA --- */}
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        
        {activeTab === 'kas' && <MutasiKas user={user} />}
        
        {activeTab === 'warga' && <DataWarga role={user.role} />}
        
        {activeTab === 'kegiatan' && <KegiatanRT role={user.role} />}
        
        {activeTab === 'toko' && <InputToko user={user} viewOnly={!isHumas} />}

        {activeTab === 'input' && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            <h3>Menu Input Khusus Pengurus</h3>
            <p>Silakan pilih menu spesifik di atas (Keuangan/Kegiatan) untuk input harian. Menu ini khusus untuk data master.</p>
            <div style={{ display: 'grid', gap: '10px' }}>
               {(isSekretaris || isDawis) && <InputData user={user} />}
            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: 'center', padding: '20px', color: '#777', fontSize: '12px' }}>
        &copy; 2025 SIMAKARTI RT 03 - Dibangun untuk Warga
      </footer>
    </div>
  );
}

// Style Tombol
const btnStyle = (isActive) => ({
  padding: '8px 16px',
  background: isActive ? '#3498db' : 'transparent',
  color: isActive ? 'white' : '#555',
  border: isActive ? 'none' : '1px solid #ddd',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: isActive ? 'bold' : '500',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s'
});

export default App;e
