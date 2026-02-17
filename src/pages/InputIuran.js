import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [selectedWarga, setSelectedWarga] = useState('');
  const [form, setForm] = useState({ tipe_kas: 'RT', jumlah: '', keterangan: '' });
  const [loading, setLoading] = useState(false);

  // Filter Dawis (Contoh: jika user.role adalah 'dawis1', maka filter 'DAWIS I')
  const dawisLabel = user.role.toUpperCase().replace('DAWIS', 'DAWIS ');

  useEffect(() => {
    fetchWargaByDawis();
  }, []);

  const fetchWargaByDawis = async () => {
    // Dawis hanya bisa mengambil data warga di wilayahnya
    const { data } = await supabase
      .from('warga')
      .select('id, nama_lengkap')
      .eq('dawis', dawisLabel)
      .order('nama_lengkap', { ascending: true });
    setWargaList(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return alert("Pilih nama warga!");
    
    setLoading(true);
    const namaWarga = wargaList.find(w => w.id === selectedWarga)?.nama_lengkap;

    const { error } = await supabase.from('mutasi_kas').insert([
      {
        tipe_kas: form.tipe_kas,
        jenis: 'Masuk',
        jumlah: parseFloat(form.jumlah),
        keterangan: `Iuran ${form.tipe_kas} - ${namaWarga} (via ${user.username})`,
        warga_id: selectedWarga,
        pj: user.username
      }
    ]);

    if (!error) {
      alert(`Iuran ${namaWarga} berhasil disimpan!`);
      setForm({ ...form, jumlah: '', keterangan: '' });
      setSelectedWarga('');
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
      <h3 style={{ textAlign: 'center', color: '#2c3e50' }}>📥 Setoran Iuran {dawisLabel}</h3>
      <p style={{ textAlign: 'center', fontSize: '13px', color: '#7f8c8d' }}>Input iuran warga wilayah {dawisLabel}</p>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={labelS}>Pilih Warga</label>
          <select style={inputS} value={selectedWarga} onChange={e => setSelectedWarga(e.target.value)} required>
            <option value="">-- Pilih Nama --</option>
            {wargaList.map(w => (
              <option key={w.id} value={w.id}>{w.nama_lengkap}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={labelS}>Jenis Iuran</label>
            <select style={inputS} value={form.tipe_kas} onChange={e => setForm({...form, tipe_kas: e.target.value})}>
              <option value="RT">Kas RT</option>
              <option value="KGR">Kas KGR</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelS}>Jumlah (Rp)</label>
            <input type="number" style={inputS} value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} placeholder="Contoh: 20000" required />
          </div>
        </div>

        <div>
          <label style={labelS}>Keterangan Tambahan (Opsional)</label>
          <input type="text" style={inputS} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} placeholder="Misal: Iuran bulan Februari" />
        </div>

        <button type="submit" disabled={loading} style={btnS}>
          {loading ? 'Menyimpan...' : 'Simpan Setoran'}
        </button>
      </form>
    </div>
  );
};

const labelS = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' };
const inputS = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btnS = { padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };

export default InputIuran;
