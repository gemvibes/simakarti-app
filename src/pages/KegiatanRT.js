import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const KegiatanRT = ({ user }) => {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // State untuk form input kegiatan baru
  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    tanggal: new Date().toISOString().split('T')[0],
    notulensi: '',
    lokasi: 'RT 03'
  });

  // Role Check: Hanya Sekretaris dan Ketua yang bisa tambah/edit
  const canInput = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = async () => {
    setLoading(true);
    // Menggunakan nama tabel sesuai screenshot: kegiatan_rt
    const { data, error } = await supabase
      .from('kegiatan_rt')
      .select('*')
      .order('tanggal', { ascending: false });

    if (!error) {
      setKegiatan(data || []);
    } else {
      console.error("Error fetching kegiatan:", error.message);
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase
      .from('kegiatan_rt')
      .insert([{ 
        ...formData, 
        pj: user.username 
      }]);

    if (!error) {
      alert("✅ Kegiatan berhasil dicatat!");
      setFormData({ nama_kegiatan: '', tanggal: new Date().toISOString().split('T')[0], notulensi: '', lokasi: 'RT 03' });
      setShowForm(false);
      fetchKegiatan();
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
    setLoading(false);
  };

  if (loading && kegiatan.length === 0) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data kegiatan...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#2c3e50' }}>📅 Agenda & Notulensi Kegiatan</h3>
        {canInput && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            style={{ background: showForm ? '#e74c3c' : '#3498db', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            {showForm ? 'Batal' : '+ Tambah Kegiatan'}
          </button>
        )}
      </div>

      {/* Form Input Khusus Sekretaris/Ketua */}
      {showForm && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSave}>
            <div style={formGroup}>
              <label style={labelS}>Nama Kegiatan:</label>
              <input type="text" required style={inputS} value={formData.nama_kegiatan} onChange={(e) => setFormData({...formData, nama_kegiatan: e.target.value})} placeholder="Contoh: Rapat Rutin Bulanan" />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ ...formGroup, flex: 1 }}>
                <label style={labelS}>Tanggal:</label>
                <input type="date" required style={inputS} value={formData.tanggal} onChange={(e) => setFormData({...formData, tanggal: e.target.value})} />
              </div>
              <div style={{ ...formGroup, flex: 1 }}>
                <label style={labelS}>Lokasi:</label>
                <input type="text" style={inputS} value={formData.lokasi} onChange={(e) => setFormData({...formData, lokasi: e.target.value})} />
              </div>
            </div>
            <div style={formGroup}>
              <label style={labelS}>Notulensi / Hasil Pertemuan:</label>
              <textarea rows="4" style={{...inputS, resize: 'vertical'}} value={formData.notulensi} onChange={(e) => setFormData({...formData, notulensi: e.target.value})} placeholder="Tuliskan poin-poin hasil rapat di sini..."></textarea>
            </div>
            <button type="submit" disabled={loading} style={btnSaveS}>
              {loading ? 'Menyimpan...' : 'SIMPAN KEGIATAN'}
            </button>
          </form>
        </div>
      )}

      {/* Daftar Riwayat Kegiatan */}
      {kegiatan.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>
          Belum ada riwayat kegiatan yang tercatat.
        </div>
      ) : (
        kegiatan.map(k => (
          <div key={k.id} style={cardKegiatan}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '18px' }}>{k.nama_kegiatan}</h4>
                <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                  <span style={metaS}>🗓️ {k.tanggal}</span>
                  <span style={metaS}>📍 {k.lokasi || 'RT 03'}</span>
                </div>
              </div>
              <span style={pjBadge}>Oleh: {k.pj}</span>
            </div>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
              <strong style={{ fontSize: '14px', color: '#34495e' }}>Hasil Pertemuan:</strong>
              <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.6', marginTop: '5px', whiteSpace: 'pre-line' }}>
                {k.notulensi || 'Tidak ada catatan notulensi.'}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// --- STYLES ---
const formGroup = { marginBottom: '15px' };
const labelS = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' };
const inputS = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' };
const btnSaveS = { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const cardKegiatan = { background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', borderLeft: '5px solid #3498db' };
const metaS = { fontSize: '12px', color: '#95a5a6' };
const pjBadge = { background: '#f8f9fa', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' };

export default KegiatanRT;
