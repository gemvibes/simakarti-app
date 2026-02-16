import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. KONFIGURASI SUPABASE
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  // --- STATE MANAGEMENT ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  
  const [warga, setWarga] = useState([]);
  const [kas, setKas] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // STATE FORM INPUT
  const [formDataWarga, setFormDataWarga] = useState({ nama_lengkap: '', no_hp: '', status_rumah: 'Tetap' });
  const [formDataKas, setFormDataKas] = useState({ nominal: '', jenis_transaksi: 'Pemasukan', keterangan: '' });

  // --- LOGIKA LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === 'rt03') {
      setIsLoggedIn(true);
      fetchAllData();
    } else {
      alert('Akses Ditolak! Username/Password Salah.');
    }
  };

  // --- AMBIL DATA DARI DATABASE ---
  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ambil Warga
      const { data: dWarga } = await supabase.from('warga').select('*').order('nama_lengkap', { ascending: true });
      // Ambil Kas
      const { data: dKas, error: eKas } = await supabase.from('transaksi_kas').select('*').order('tanggal', { ascending: false });
      
      if (eKas) throw eKas;

      // Hitung Saldo
      let total = 0;
      dKas?.forEach(t => {
        const tipe = t.jenis_transaksi || t.jenis;
        if (tipe === 'Pemasukan') total += Number(t.nominal);
        else total -= Number(t.nominal);
      });

      setWarga(dWarga || []);
      setKas(dKas || []);
      setSaldo(total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- FUNGSI SIMPAN DATA ---
  const handleAddWarga = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('warga').insert([formDataWarga]);
    if (error) alert("Gagal simpan warga: " + error.message);
    else {
      alert('Warga berhasil ditambahkan!');
      setFormDataWarga({ nama_lengkap: '', no_hp: '', status_rumah: 'Tetap' });
      fetchAllData();
    }
  };

  const handleAddKas = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('transaksi_kas').insert([{
      nominal: Number(formDataKas.nominal),
      jenis_transaksi: formDataKas.jenis_transaksi,
      keterangan: formDataKas.keterangan,
      tanggal: new Date().toISOString()
    }]);
    if (error) alert("Gagal simpan transaksi: " + error.message);
    else {
      alert('Transaksi Kas berhasil dicatat!');
      setFormDataKas({ nominal: '', jenis_transaksi: 'Pemasukan', keterangan: '' });
      fetchAllData();
      setActiveTab('dashboard'); // Kembali ke dashboard untuk lihat saldo baru
    }
  };

  // --- KOMPONEN UI ---
  const HeaderLogo = () => (
    <div style={{ textAlign: 'center', marginBottom: '20px', padding: '10px' }}>
      <h1 style={{ margin: 0, color: '#2c3e50', letterSpacing: '2px', fontSize: '28px' }}>SIMAKARTI</h1>
      <p style={{ margin: 0, fontSize: '11px', color: '#34495e', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Sistem Informasi Manajemen Kas RT Tiga
      </p>
    </div>
  );

  // TAMPILAN JIKA BELUM LOGIN
  if (!isLoggedIn) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'sans-serif', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
        <HeaderLogo />
        <div style={{ display: 'inline-block', width: '100%', maxWidth: '350px', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginBottom: '25px', color: '#2c3e50' }}>Portal Superadmin</h3>
          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Username</label>
              <input type="text" value={user} onChange={(e) => setUser(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} placeholder="admin" />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} placeholder="••••••" />
            </div>
            <button type="submit" style={{ width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>MASUK KE SISTEM</button>
          </form>
        </div>
      </div>
    );
  }

  // TAMPILAN DASHBOARD UTAMA
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#fff', borderLeft: '1px solid #eee', borderRight: '1px solid #eee' }}>
      <header style={{ padding: '20px', borderBottom: '1px solid #eee', position: 'relative' }}>
        <HeaderLogo />
        <button onClick={() => setIsLoggedIn(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#ff4757', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' }}>LOGOUT</button>
      </header>

      {/* NAVIGASI BAWAH (STICKY) */}
      <nav style={{ display: 'flex', background: '#2c3e50', padding: '5px', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => setActiveTab('dashboard')} style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'dashboard' ? '#34495e' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '12px' }}>📊 KAS</button>
        <button onClick={() => setActiveTab('warga')} style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'warga' ? '#34495e' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '12px' }}>👥 WARGA</button>
        <button onClick={() => setActiveTab('input')} style={{ flex: 1, padding: '12px', border: 'none', background: activeTab === 'input' ? '#34495e' : 'transparent', color: 'white', cursor: 'pointer', fontSize: '12px' }}>➕ INPUT</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {error && <div style={{ background: '#ffcccc', color: 'red', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>Error: {error}</div>}

        {/* HALAMAN 1: DASHBOARD KAS */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #1e3799, #4a69bd)', color: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', marginBottom: '25px', boxShadow: '0 10px 20px rgba(30,55,153,0.2)' }}>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>Total Saldo Kas RT 03</p>
              <h1 style={{ margin: '10px 0', fontSize: '36px' }}>Rp {saldo.toLocaleString('id-ID')}</h1>
            </div>
            <h3 style={{ color: '#2c3e50', borderLeft: '4px solid #1e3799', paddingLeft: '10px' }}>Riwayat Transaksi</h3>
            {loading ? <p>Memuat data...</p> : kas.map(k => (
              <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderBottom: '1px solid #f1f1f1', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>{k.keterangan || 'Tanpa Keterangan'}</div>
                  <div style={{ fontSize: '11px', color: '#95a5a6' }}>{new Date(k.tanggal).toLocaleDateString('id-ID')}</div>
                </div>
                <div style={{ fontWeight: 'bold', color: (k.jenis_transaksi || k.jenis) === 'Pemasukan' ? '#2ecc71' : '#e74c3c' }}>
                  {(k.jenis_transaksi || k.jenis) === 'Pemasukan' ? '+' : '-'} {Number(k.nominal).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HALAMAN 2: DATA WARGA */}
        {activeTab === 'warga' && (
          <div>
            <h3 style={{ color: '#2c3e50', borderLeft: '4px solid #1e3799', paddingLeft: '10px' }}>Daftar Warga RT 03</h3>
            <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '20px' }}>Total: {warga.length} Kepala Keluarga/Warga</p>
            {warga.map(w => (
              <div key={w.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '12px', marginBottom: '10px', background: '#fcfcfc' }}>
                <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{w.nama_lengkap}</div>
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>📞 {w.no_hp || '-'} | 🏠 {w.status_rumah}</div>
              </div>
            ))}
          </div>
        )}

        {/* HALAMAN 3: INPUT DATA */}
        {activeTab === 'input' && (
          <div>
            <h3 style={{ color: '#2c3e50', borderLeft: '4px solid #1e3799', paddingLeft: '10px' }}>Input Data Baru</h3>
            
            {/* Form Input Kas */}
            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '30px', border: '1px solid #e9ecef' }}>
              <h4 style={{ marginTop: 0 }}>💰 Catat Transaksi Kas</h4>
              <form onSubmit={handleAddKas}>
                <label style={{ fontSize: '12px' }}>Keterangan</label>
                <input type="text" required value={formDataKas.keterangan} onChange={(e) => setFormDataKas({...formDataKas, keterangan: e.target.value})} style={{ width: '100%', padding: '10px', margin: '5px 0 15px 0', boxSizing: 'border-box' }} placeholder="Contoh: Iuran Sampah Jan" />
                
                <label style={{ fontSize: '12px' }}>Nominal (Rupiah)</label>
                <input type="number" required value={formDataKas.nominal} onChange={(e) => setFormDataKas({...formDataKas, nominal: e.target.value})} style={{ width: '100%', padding: '10px', margin: '5px 0 15px 0', boxSizing: 'border-box' }} placeholder="50000" />
                
                <label style={{ fontSize: '12px' }}>Jenis Transaksi</label>
                <select value={formDataKas.jenis_transaksi} onChange={(e) => setFormDataKas({...formDataKas, jenis_transaksi: e.target.value})} style={{ width: '100%', padding: '10px', margin: '5px 0 20px 0' }}>
                  <option value="Pemasukan">Pemasukan (Uang Masuk)</option>
                  <option value="Pengeluaran">Pengeluaran (Uang Keluar)</option>
                </select>
                
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#1e3799', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>SIMPAN TRANSAKSI</button>
              </form>
            </div>

            {/* Form Input Warga */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '15px', border: '1px solid #eee' }}>
              <h4 style={{ marginTop: 0 }}>👥 Tambah Warga Baru</h4>
              <form onSubmit={handleAddWarga}>
                <label style={{ fontSize: '12px' }}>Nama Lengkap</label>
                <input type="text" required value={formDataWarga.nama_lengkap} onChange={(e) => setFormDataWarga({...formDataWarga, nama_lengkap: e.target.value})} style={{ width: '100%', padding: '10px', margin: '5px 0 15px 0', boxSizing: 'border-box' }} />
                
                <label style={{ fontSize: '12px' }}>Nomor HP</label>
                <input type="text" value={formDataWarga.no_hp} onChange={(e) => setFormDataWarga({...formDataWarga, no_hp: e.target.value})} style={{ width: '100%', padding: '10px', margin: '5px 0 15px 0', boxSizing: 'border-box' }} />
                
                <label style={{ fontSize: '12px' }}>Status Rumah</label>
                <select value={formDataWarga.status_rumah} onChange={(e) => setFormDataWarga({...formDataWarga, status_rumah: e.target.value})} style={{ width: '100%', padding: '10px', margin: '5px 0 20px 0' }}>
                  <option value="Tetap">Tetap</option>
                  <option value="Kontrak">Kontrak</option>
                </select>
                
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>SIMPAN DATA WARGA</button>
              </form>
            </div>
          </div>
        )}
      </main>

      <footer style={{ padding: '30px 20px', textAlign: 'center', fontSize: '11px', color: '#bdc3c7' }}>
        <p>© 2024 SIMAKARTI App - Sistem Informasi Manajemen Kas RT Tiga</p>
      </footer>
    </div>
  );
}

export default App;
