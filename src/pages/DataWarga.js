import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DataWarga = ({ user }) => {
  const [warga, setWarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Role Check
  const isAdmin = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => {
    fetchWarga();
  }, []);

  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('is_active', true) // Hanya tampilkan yang aktif
      .order('nama_lengkap', { ascending: true });

    if (!error) setWarga(data || []);
    setLoading(false);
  };

  const handleSoftDelete = async (id, nama) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${nama}? (Data iuran lama tetap tersimpan di sistem)`)) {
      const { error } = await supabase
        .from('warga')
        .update({ is_active: false })
        .eq('id', id);

      if (!error) {
        alert("Warga berhasil dinonaktifkan.");
        fetchWarga();
      }
    }
  };

  const filteredWarga = warga.filter(w => 
    w.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.dawis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data warga...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>👥 Data Warga & Toko RT 03</h3>
        {isAdmin && (
          <button style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Tambah Baru
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Cari nama atau dawis..." 
          style={searchS} 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={thS}>Nama Lengkap</th>
                <th style={thS}>Dawis / Kategori</th>
                <th style={thS}>Tipe</th>
                {isAdmin && <th style={thS}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={tdS}>
                    <div style={{ fontWeight: 'bold' }}>{w.nama_lengkap}</div>
                  </td>
                  <td style={tdS}>
                    <span style={w.dawis === 'TOKO' ? badgeToko : badgeDawis}>{w.dawis}</span>
                  </td>
                  <td style={tdS}>
                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{w.tipe_subjek || 'Warga'}</span>
                  </td>
                  {isAdmin && (
                    <td style={tdS}>
                      <button style={btnEdit}>Edit</button>
                      <button 
                        onClick={() => handleSoftDelete(w.id, w.nama_lengkap)} 
                        style={btnHapus}
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const thS = { padding: '15px', textAlign: 'left', fontSize: '13px', color: '#7f8c8d', textTransform: 'uppercase' };
const tdS = { padding: '15px', fontSize: '14px' };
const searchS = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none' };
const badgeDawis = { background: '#ebf5ff', color: '#3498db', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
const badgeToko = { background: '#fef9e7', color: '#f1c40f', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
const btnEdit = { background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' };
const btnHapus = { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

export default DataWarga;
