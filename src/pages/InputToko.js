import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputToko = ({ role }) => {
  const [tokoList, setTokoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nama_toko: '',
    pemilik: '',
    jenis_usaha: ''
  });

  // Fungsi mengambil data toko
  const fetchToko = async () => {
    const { data, error } = await supabase
      .from('toko_warga')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setTokoList(data || []);
  };

  useEffect(() => {
    fetchToko();
  }, []);

  // Fungsi Approve untuk Bendahara/Ketua
  const handleApprove = async (id) => {
    const { error } = await supabase
      .from('toko_warga')
      .update({ status: 'Approved' })
      .eq('id', id);

    if (error) {
      alert("Gagal menyetujui: " + error.message);
    } else {
      alert("Toko telah disetujui dan dipublikasikan!");
      fetchToko();
    }
  };

  // Fungsi Hapus (Opsional untuk Admin)
  const handleDelete = async (id) => {
    if (window.confirm("Hapus data toko ini?")) {
      const { error } = await supabase.from('toko_warga').delete().eq('id', id);
      if (!error) fetchToko();
    }
  };

  // Fungsi Simpan untuk Humas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('toko_warga')
      .insert([{ 
        ...formData, 
        status: 'Pending' // Otomatis pending saat pertama input
      }]);

    if (error) {
      alert("Gagal: " + error.message);
    } else {
      alert("Data terkirim! Silakan hubungi Bendahara untuk proses persetujuan.");
      setFormData({ nama_toko: '', pemilik: '', jenis_usaha: '' });
      fetchToko();
    }
    setLoading(false);
  };

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3 style={{ borderLeft: '4px solid #f39c12', paddingLeft: '10px' }}>Manajemen UMKM RT 03</h3>

      {/* FORM INPUT: Hanya Humas & Ketua */}
      {(role === 'humas' || role === 'ketua') && (
        <div style={cardForm}>
          <h4 style={{ marginTop: 0 }}>📝 Form Pendaftaran Toko (Humas)</h4>
          <form onSubmit={handleSubmit}>
            <input 
              type="text" placeholder="Nama Toko" required style={inS}
              value={formData.nama_toko} onChange={e => setFormData({...formData, nama_toko: e.target.value})}
            />
            <input 
              type="text" placeholder="Nama Pemilik" required style={inS}
              value={formData.pemilik} onChange={e => setFormData({...formData, pemilik: e.target.value})}
            />
            <input 
              type="text" placeholder="Jenis Usaha (Kuliner/Jasa/Sembako)" required style={inS}
              value={formData.jenis_usaha} onChange={e => setFormData({...formData, jenis_usaha: e.target.value})}
            />
            <button type="submit" disabled={loading} style={btS}>
              {loading ? 'Mengirim...' : 'KIRIM KE BENDAHARA'}
            </button>
          </form>
        </div>
      )}

      {/* PANEL PERSETUJUAN: Hanya Bendahara & Ketua */}
      {['bendahara', 'ketua'].includes(role) && (
        <div style={{ marginTop: '25px' }}>
          <h4>🔔 Menunggu Persetujuan Bendahara</h4>
          {tokoList.filter(t => t.status === 'Pending').length === 0 && <p style={nodata}>Tidak ada antrean persetujuan.</p>}
          {tokoList.filter(t => t.status === 'Pending').map(t => (
            <div key={t.id} style={itemPending}>
              <div>
                <strong>{t.nama_toko}</strong><br/>
                <small>Pemilik: {t.pemilik} | {t.jenis_usaha}</small>
              </div>
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => handleApprove(t.id)} style={btnApprove}>APPROVE</button>
                <button onClick={() => handleDelete(t.id)} style={btnDelete}>TOLAK</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DAFTAR PUBLIK: Semua Bisa Lihat */}
      <h4 style={{ marginTop: '30px' }}>🏪 Daftar Toko Warga Terverifikasi</h4>
      <div style={{ display: 'grid', gap: '10px' }}>
        {tokoList.filter(t => t.status === 'Approved').map(t => (
          <div key={t.id} style={itemApproved}>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{t.nama_toko} ✅</div>
            <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
              Pemilik: {t.pemilik} | Bidang: {t.jenis_usaha}
            </div>
          </div>
        ))}
        {tokoList.filter(t => t.status === 'Approved').length === 0 && <p style={nodata}>Belum ada toko yang disetujui.</p>}
      </div>
    </div>
  );
};

// CSS in JS
const cardForm = { background: '#fffaf0', padding: '20px', borderRadius: '12px', border: '1px solid #f39c12' };
const inS = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btS = { width: '100%', padding: '12px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const itemPending = { padding: '15px', background: '#fdf2e9', border: '1px dashed #e67e22', borderRadius: '8px', marginBottom: '10px' };
const itemApproved = { padding: '15px', background: '#fff', border: '1px solid #eee', borderRadius: '8px' };
const btnApprove = { background: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', marginRight: '5px', fontSize: '11px' };
const btnDelete = { background: '#e74c3c', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '11px' };
const nodata = { fontSize: '12px', color: '#999', fontStyle: 'italic' };

export default InputToko;
