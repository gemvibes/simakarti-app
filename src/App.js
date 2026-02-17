import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import InputData from './pages/InputData';
import InputToko from './pages/InputToko';
import KegiatanRT from './pages/KegiatanRT';

function App() {
  // 1. Cek apakah ada data user tersimpan di browser (LocalStorage)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('simakarti_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  // 2. Fungsi Login: Simpan data ke LocalStorage agar awet
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('simakarti_user', JSON.stringify(userData));
    setActiveTab('dashboard');
  };

  // 3. Fungsi Logout: Hapus data dari LocalStorage
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simakarti_user');
    setActiveTab('dashboard');
  };

  // Jika belum login, tampilkan halaman Login
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- LOGIKA TAMPILAN MENU BERDASARKAN ROLE ---
  const isWarga = user.role === 'warga';
  const isKetua = user.role === 'ketua';
  const isSekretaris = user.role === 'sekretaris' || isKetua;
  const isBendahara = user.role === 'bendahara' || isKetua;
  const isHumas = user.role === 'humas' || isKetua;
  const isDawis = user.role.startsWith('dawis');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', background: '#f4f6f8' }}>
      
      {/* --- HEADER --- */}
      <header style={{ background: '#2c3e50', padding: '15px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>SIMAKARTI RT 03</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px' }}>Halo, {user.username} ({user.role})</span>
          <button 
            onClick={handleLogout} 
            style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
          >
            Keluar
          </button>
        </div>
      </header>

      {/* --- MENU NAVIGASI --- */}
      <nav style={{ background: 'white', padding: '10px 20px', borderBottom: '1px solid #ddd', overflowX: 'auto', display: 'flex', gap: '10px' }}>
        
        {/* Menu Umum (Semua Bisa Lihat) */}
        <button style={btnStyle(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>🏠 Dashboard</button>
        <button style={btnStyle(activeTab === 'warga')} onClick={() => setActiveTab('warga')}>👥 Data Warga</button>
        
        {/* Menu Khusus Warga & Sekretaris */}
        <button style={btnStyle(activeTab === 'kegiatan')} onClick={() => setActiveTab('kegiatan')}>📅 Kegiatan & Absen</button>

        {/* Menu Input (Khusus Pengurus) */}
        {(isSekretaris || isBendahara || isHumas || isDawis) && (
          <button style={btnStyle(activeTab === 'input')} onClick={() => setActiveTab('input')}>📝 Input Data</button>
        )}

        {/* Menu Toko (Khusus Humas & Warga) */}
        <button style={btnStyle(activeTab === 'toko')} onClick={() => setActiveTab('toko')}>🏪 UMKM Warga</button>
      </nav>

      {/* --- KONTEN UTAMA --- */}
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        
        {activeTab === 'warga' && <DataWarga role={user.role} />}
        
        {activeTab === 'input' && (
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
            {isHumas && <InputToko user={user} />}
            {(isSekretaris || isDawis) && <InputData user={user} />}
            {/* Nanti Input Kas Bendahara disini */}
          </div>
        )}

        {activeTab === 'toko' && <InputToko user={user} viewOnly={!isHumas} />}
        
        {activeTab === 'kegiatan' && <KegiatanRT role={user.role} />}

      </main>
    </div>
  );
}

// Style Tombol Menu
const btnStyle = (isActive) => ({
  padding: '8px 16px',
  background: isActive ? '#3498db' : 'transparent',
  color: isActive ? 'white' : '#555',
  border: isActive ? 'none' : '1px solid #ddd',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: isActive ? 'bold' : 'normal',
  whiteSpace: 'nowrap'
});

export default App;
