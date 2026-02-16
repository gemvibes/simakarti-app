import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Konek ke Supabase (Otomatis baca dari Vercel Environment Variables)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [warga, setWarga] = useState([]);
  const [saldo, setSaldo] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. Fungsi Ambil Data saat Aplikasi dibuka
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);

        // Ambil data Warga
        const { data: dataWarga, error: errorWarga } = await supabase
          .from('warga')
          .select('*');

        if (errorWarga) throw errorWarga;

        // Ambil data Kas untuk hitung saldo
        const { data: dataKas, error: errorKas } = await supabase
          .from('transaksi_kas')
          .select('jenis, nominal');

        if (errorKas) throw errorKas;

        // Hitung Saldo (Pemasukan - Pengeluaran)
        let totalSaldo = 0;
        if (dataKas) {
            dataKas.forEach(transaksi => {
                if (transaksi.jenis === 'Pemasukan') {
                    totalSaldo += transaksi.nominal;
                } else {
                    totalSaldo -= transaksi.nominal;
                }
            });
        }

        setWarga(dataWarga || []);
        setSaldo(totalSaldo);

      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // 3. Tampilan Halaman (UI)
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', margin: '0' }}>SIMAKARTI</h1>
        <p style={{ color: '#7f8c8d' }}>Sistem Manajemen Warga RT 03</p>
      </header>

      {/* Kartu Saldo */}
      <div style={{ 
        backgroundColor: '#3498db', 
        color: 'white', 
        padding: '20px', 
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', opacity: 0.9 }}>💰 Saldo Kas RT</h3>
        <h2 style={{ margin: '0', fontSize: '32px' }}>
          Rp {saldo.toLocaleString('id-ID')}
        </h2>
      </div>

      {/* Status Loading/Error */}
      {loading && <p style={{ textAlign: 'center' }}>Sedang memuat data...</p>}
      {error && <p style={{ color: 'red', textAlign: 'center' }}>Error: {error}</p>}

      {/* Daftar Warga */}
      {!loading && !error && (
        <div>
          <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>👥 Data Warga ({warga.length})</h3>
          
          {warga.length === 0 ? (
            <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>Belum ada data warga.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {warga.map((orang) => (
                <li key={orang.id} style={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #eee',
                  marginBottom: '10px',
                  padding: '15px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ fontSize: '16px', display: 'block' }}>{orang.nama_lengkap}</strong>
                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {orang.status_rumah} • {orang.no_hp}
                    </span>
                  </div>
                  <span style={{ 
                    backgroundColor: orang.status_rumah === 'Tetap' ? '#e1f5fe' : '#fff3e0',
                    color: orang.status_rumah === 'Tetap' ? '#0288d1' : '#ef6c00',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {orang.status_rumah}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      <footer style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#bdc3c7' }}>
        <p>&copy; 2024 SIMAKARTI App</p>
      </footer>
    </div>
  );
}

export default App;
