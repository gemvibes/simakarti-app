import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Konfigurasi Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [warga, setWarga] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Login: admin / rt03
  const handleLogin = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'rt03') {
      setIsLoggedIn(true);
      fetchData();
    } else {
      alert('Username atau Password salah!');
    }
  };

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      // Ambil data warga
      const { data: dWarga } = await supabase.from('warga').select('*');
      
      // Ambil data kas - Menggunakan kolom 'jenis_transaksi' sesuai SQL kamu
      const { data: dKas, error: eKas } = await supabase.from('transaksi_kas').select('*');
      
      if (eKas) throw eKas;

      let total = 0;
      dKas?.forEach(t => {
        // Cek kolom 'jenis_transaksi' (sesuai SQL) atau 'jenis' (cadangan)
        const tipe = t.jenis_transaksi || t.jenis; 
        if (tipe === 'Pemasukan') total += t.nominal;
        else if (tipe === 'Pengeluaran') total -= t.nominal;
      });

      setWarga(dWarga || []);
      setSaldo(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // TAMPILAN LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <div style={{ display: 'inline-block', width: '100%', maxWidth: '350px', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🔐 SIMAKARTI RT03</h2>
          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Username</label>
              <input type="text" value={user} onChange={(e) => setUser(e.target.value)} placeholder="Masukkan username" style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Password</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Masukkan password" style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  // TAMPILAN DASHBOARD
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ color: '#2c3e50', margin: '0', fontSize: '24px' }}>SIMAKARTI</h1>
          <p style={{ color: '#7f8c8d', margin: '0', fontSize: '12px' }}>Manajemen RT 03</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
      </header>

      <div style={{ backgroundColor: '#2980b9', color: 'white', padding: '25px', borderRadius: '15px', textAlign: 'center', marginBottom: '25px', boxShadow: '0 4px 15px rgba(41, 128, 185, 0.3)' }}>
        <p style={{ margin: '0', opacity: 0.8, fontSize: '14px' }}>Total Kas RT</p>
        <h2 style={{ margin: '5px 0 0 0', fontSize: '36px' }}>Rp {saldo.toLocaleString('id-ID')}</h2>
      </div>

      {error && <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px', border: '1px solid #fca5a5' }}>⚠️ <b>Database Error:</b> {error}</div>}

      <div>
        <h3 style={{ borderBottom: '2px solid #f0f2f5', paddingBottom: '10px', color: '#2c3e50' }}>👥 Daftar Warga ({warga.length})</h3>
        {loading ? <p style={{ textAlign: 'center', color: '#7f8c8d' }}>Mengambil data...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {warga.length === 0 ? <p style={{ textAlign: 'center', color: '#bdc3c7', fontStyle: 'italic' }}>Belum ada data warga.</p> : 
              warga.map((orang) => (
                <div key={orang.id} style={{ border: '1px solid #f0f2f5', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{orang.nama_lengkap}</div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>{orang.no_hp || 'No HP Belum Ada'}</div>
                  </div>
                  <div style={{ fontSize: '11px', background: '#ecf0f1', padding: '4px 8px', borderRadius: '4px', color: '#7f8c8d' }}>{orang.status_rumah}</div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
