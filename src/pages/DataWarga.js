import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DataWarga = () => {
  const [warga, setWarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fungsi mengambil data dari tabel 'warga'
  const fetchWarga = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warga')
        .select('*')
        .order('nama_lengkap', { ascending: true });

      if (error) throw error;
      setWarga(data || []);
    } catch (error) {
      console.error('Gagal mengambil data warga:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  // Fitur pencarian nama warga
  const filteredWarga = warga.filter((w) =>
    w.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3 style={{ borderLeft: '4px solid #2ecc71', paddingLeft: '10px' }}>Data Warga RT 03</h3>

      {/* Input Pencarian */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Cari nama warga..."
          style={searchBox}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>Memuat data...</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                <th style={thStyle}>No.</th>
                <th style={thStyle}>Nama Lengkap</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((w, index) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', textTransform: 'uppercase' }}>{w.nama_lengkap}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '10px',
                      background: w.status_rumah === 'Tetap' ? '#e1f7e7' : '#fff9db',
                      color: w.status_rumah === 'Tetap' ? '#27ae60' : '#f39c12'
                    }}>
                      {w.status_rumah}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredWarga.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              Data warga tidak ditemukan.
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '15px', fontSize: '12px', color: '#7f8c8d', textAlign: 'right' }}>
        Total: <strong>{filteredWarga.length}</strong> Jiwa
      </div>
    </div>
  );
};

// Styling Objek
const searchBox = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ddd',
  boxSizing: 'border-box',
  fontSize: '14px',
  outline: 'none'
};

const thStyle = {
  padding: '12px 15px',
  color: '#2c3e50',
  fontWeight: 'bold',
  borderBottom: '2px solid #eee'
};

const tdStyle = {
  padding: '12px 15px',
  color: '#34495e'
};

export default DataWarga;
