import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Import Halaman dari folder pages
// Pastikan nama file di GitHub: Dashboard.js, DataWarga.js, InputData.js
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import InputData from './pages/InputData';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'rt03') {
      setIsLoggedIn(true);
    } else {
      alert('Login Gagal!');
    }
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>SIMAKARTI</h1>
        <p>Sistem Informasi Manajemen Kas RT Tiga</p>
        <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
          <label>Username</label><br/>
          <input type="text" value={user} onChange={(e) => setUser(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} /><br/>
          <label>Password</label><br/>
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: '100%', marginBottom: '20px' }} /><br/>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2c3e50', color: 'white' }}>LOGIN</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', padding: '20px', borderBottom: '2px solid #eee' }}>
        <h1 style={{ margin: 0 }}>SIMAKARTI</h1>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold' }}>Sistem Informasi Manajemen Kas RT Tiga</p>
      </header>

      <nav style={{ display: 'flex', background: '#2c3e50', color: 'white' }}>
        <button onClick={() => setActivePage('dashboard')} style={{ flex: 1, padding: '15px', background: activePage === 'dashboard' ? '#34495e' : 'none', color: 'white', border: 'none' }}>Dashboard</button>
        <button onClick={() => setActivePage('warga')} style={{ flex: 1, padding: '15px', background: activePage === 'warga' ? '#34495e' : 'none', color: 'white', border: 'none' }}>Warga</button>
        <button onClick={() => setActivePage('input')} style={{ flex: 1, padding: '15px', background: activePage === 'input' ? '#34495e' : 'none', color: 'white', border: 'none' }}>Input</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {activePage === 'dashboard' && <Dashboard supabase={supabase} />}
        {activePage === 'warga' && <DataWarga supabase={supabase} />}
        {activePage === 'input' && <InputData supabase={supabase} />}
      </main>
    </div>
  );
}

export default App;
