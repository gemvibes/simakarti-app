import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const KegiatanRT = ({ role }) => {
  const [warga, setWarga] = useState([]);
  const [pertemuan, setPertemuan] = useState([]);
  const [selectedWarga, setSelectedWarga] = useState([]);
  const [form, setForm] = useState({ tanggal: '', lokasi: '', judul: '', notulen: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Ambil Data Warga untuk Absen
    const { data: dataWarga } = await supabase.from('warga').select('*').order('nama_lengkap', { ascending: true });
    setWarga(dataWarga || []);

    // Ambil Riwayat Pertemuan & Rekap Absensi
    const { data: dataPertemuan } = await supabase.from('pertemuan').select(`
      *,
      absensi (warga_id)
    `).order('tanggal', { ascending: false });
    setPertemuan(dataPertemuan || []);
  };

  const handleCheck = (id) => {
    setSelectedWarga(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const simpanPertemuan = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // 1. Simpan Data Pertemuan
    const { data: newPertemuan, error: pError } = await supabase
      .from('pertemuan')
      .insert([{ tanggal: form.tanggal, lokasi: form.lokasi, judul_acara: form.judul, notulen: form.notulen }])
      .select();

    if (!pError && selectedWarga.length > 0) {
      // 2. Simpan Data Absensi
      const absensiData = selectedWarga.map(wId => ({
        pertemuan_id: newPertemuan[0].id,
        warga_id: wId
      }));
      await supabase.from('absensi').insert(absensiData);
      
      alert("Pertemuan & Absensi Berhasil Disimpan!");
      setForm({ tanggal: '', lokasi: '', judul: '', notulen: '' });
      setSelectedWarga([]);
      fetchData();
    }
    setLoading(false);
  };

  // Hitung Rekap Tahunan (Berapa kali hadir)
  const hitungKehadiran = (wId) => {
    return pertemuan.filter(p => p.absensi.some(a => a.warga_id === wId)).length;
  };

  const isSekretaris = role === 'sekretaris' || role === 'ketua';

  return (
    <div>
      <h3>📋 Manajemen Pertemuan & Absensi</h3>

      {isSekretaris && (
        <div style={cardStyle}>
          <h4>Input Pertemuan Baru</h4>
          <form onSubmit={simpanPertemuan}>
            <input type="date" required style={inputS} value={form.tanggal} onChange={e => setForm({...form, tanggal:e.target.value})} />
            <input type="text" placeholder="Lokasi (Contoh: Rumah Bu Pardi)" required style={inputS} value={form.lokasi} onChange={e => setForm({...form, lokasi:e.target.value})} />
            <input type="text" placeholder="Judul Pertemuan" required style={inputS} value={form.judul} onChange={e => setForm({...form, judul:e.target.value})} />
            <textarea placeholder="Notulen Hasil Rapat" style={inputS} value={form.notulen} onChange={e => setForm({...form, notulen:e.target.value})} />
            
            <p><strong>Checklist Kehadiran Warga:</strong></p>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '5px' }}>
              {warga.map(w => (
                <div key={w.id} style={{ marginBottom: '5px' }}>
                  <input type="checkbox" checked={selectedWarga.includes(w.id)} onChange={() => handleCheck(w.id)} /> {w.nama_lengkap} <small>({w.dawis})</small>
                </div>
              ))}
            </div>
            <button type="submit" style={btnS} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Pertemuan & Absen'}</button>
          </form>
        </div>
      )}

      <h4>📊 Rekap Kehadiran Tahunan</h4>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#2c3e50', color: 'white' }}>
              <th style={tdS}>Nama Warga</th>
              <th style={tdS}>Dawis</th>
              <th style={tdS}>Total Hadir</th>
            </tr>
          </thead>
          <tbody>
            {warga.map(w => (
              <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdS}>{w.nama_lengkap}</td>
                <td style={tdS}>{w.dawis}</td>
                <td style={{ ...tdS, fontWeight: 'bold', color: '#27ae60' }}>{hitungKehadiran(w.id)} x</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const cardStyle = { background: '#fff', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' };
const inputS = { width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' };
const btnS = { width: '100%', padding: '10px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };
const tdS = { padding: '8px', border: '1px solid #ddd' };

export default KegiatanRT;
