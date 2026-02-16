import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const KegiatanRT = ({ role }) => {
  const [listK, setListK] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ judul_acara: '', isi_notulen: '', jumlah_hadir: '' });

  // Ambil Data Kegiatan
  const fetchKegiatan = async () => {
    const { data, error } = await supabase
      .from('kegiatan_rt')
      .select('*')
      .order('tanggal', { ascending: false });
    if (!error) setListK(data || []);
  };

  useEffect(() => { fetchKegiatan(); }, []);

  // Simpan Kegiatan (Khusus Sekretaris)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('kegiatan_rt').insert([form]);
    if (error) {
      alert('Gagal: ' + error.message);
    } else {
      alert('Notulen & Absensi Berhasil Disimpan!');
      setForm({ judul_acara: '', isi_notulen: '', jumlah_hadir: '' });
      fetchKegiatan();
    }
    setLoading(false);
  };

  const isSekretaris = role === 'sekretaris' || role === 'ketua';

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3 style={{ borderLeft: '4px solid #9b59b6', paddingLeft: '10px' }}>Agenda & Kegiatan RT</h3>

      {/* INPUT ABSENSI & NOTULEN (Hanya Sekretaris & Ketua) */}
      {isSekretaris && (
        <div style={cardForm}>
          <h4 style={{ marginTop: 0, color: '#8e44ad' }}>📝 Input Notulen & Absensi</h4>
          <form onSubmit={handleSubmit}>
            <input 
              type="text" placeholder="Judul Acara / Pertemuan" required style={inS}
              value={form.judul_acara} onChange={e => setForm({...form, judul_acara: e.target.value})}
            />
            <textarea 
              placeholder="Isi Notulen / Hasil Rapat..." required style={{...inS, height: '80px'}}
              value={form.isi_notulen} onChange={e => setForm({...form, isi_notulen: e.target.value})}
            />
            <input 
              type="number" placeholder="Jumlah Warga Hadir" required style={inS}
              value={form.jumlah_hadir} onChange={e => setForm({...form, jumlah_hadir: e.target.value})}
            />
            <button type="submit" disabled={loading} style={btS}>
              {loading ? 'Menyimpan...' : 'SIMPAN KEGIATAN'}
            </button>
          </form>
        </div>
      )}

      {/* DAFTAR RIWAYAT KEGIATAN (Semua Bisa Lihat) */}
      <h4 style={{ marginTop: '25px' }}>Riwayat Pertemuan</h4>
      {listK.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>Belum ada data kegiatan.</p>}
      
      {listK.map((k) => (
        <div key={k.id} style={itemCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <strong style={{ color: '#2c3e50' }}>{k.judul_acara}</strong>
            <span style={{ fontSize: '11px', background: '#ecf0f1', padding: '2px 6px', borderRadius: '4px' }}>
              {new Date(k.created_at).toLocaleDateString('id-ID')}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#555', margin: '5px 0', whiteSpace: 'pre-wrap' }}>{k.isi_notulen}</p>
          <div style={{ fontSize: '11px', color: '#8e44ad', fontWeight: 'bold' }}>
            👥 Kehadiran: {k.jumlah_hadir} Orang
          </div>
        </div>
      ))}
    </div>
  );
};

// Styling
const cardForm = { background: '#f5eef8', padding: '15px', borderRadius: '10px', border: '1px solid #d2b4de', marginBottom: '20px' };
const inS = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', fontFamily: 'inherit' };
const btS = { width: '100%', padding: '10px', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const itemCard = { background: 'white', padding: '15px', borderRadius: '8px', borderBottom: '1px solid #eee', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

export default KegiatanRT;
