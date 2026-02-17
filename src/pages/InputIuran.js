import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [selectedWarga, setSelectedWarga] = useState('');
  const [form, setForm] = useState({ tipe_kas: 'RT', jumlah: '', keterangan: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fungsi untuk mengubah angka biasa ke Romawi sesuai pola database Anda
  const toRomawi = (num) => {
    const romawi = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
    return romawi[num] || num;
  };

  const roleNumber = user.role.replace('dawis', ''); 
  const dawisDbPattern = `DAWIS ${toRomawi(roleNumber)}`; // Menghasilkan "DAWIS III"

  useEffect(() => {
    fetchWargaByDawis();
  }, [user.role]);

  const fetchWargaByDawis = async () => {
    setFetching(true);
    // Mencari warga yang kolom dawis-nya tepat sama dengan "DAWIS III"
    const { data, error } = await supabase
      .from('warga')
      .select('id, nama_lengkap, dawis')
      .eq('dawis', dawisDbPattern) 
      .order('nama_lengkap', { ascending: true });

    if (error) {
      console.error("Error fetch warga:", error);
    } else {
      setWargaList(data || []);
    }
    setFetching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarga) return alert("Pilih nama warga terlebih dahulu!");
    
    setLoading(true);
    const wargaObj = wargaList.find(w => w.id === selectedWarga);
    const namaWarga = wargaObj?.nama_lengkap;

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
      alert(`Berhasil! Iuran ${namaWarga} masuk ke Kas ${form.tipe_kas}`);
      setForm({ ...form, jumlah: '', keterangan: '' });
      setSelectedWarga('');
    } else {
      alert("Gagal menyimpan: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '40px' }}>📥</span>
        <h3 style={{ margin: '10px 0 5px 0', color: '#2c3e50' }}>Setoran Iuran {user.username.toUpperCase()}</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#95a5a6' }}>Wilayah: {dawisDbPattern}</p>
      </div>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={labelS}>Pilih Nama Warga</label>
          <select style={inputS} value={selectedWarga} onChange={e => setSelectedWarga(e.target.value)} required>
            <option value="">-- {fetching ? 'Memuat Nama...' : 'Pilih Nama Anggota'} --</option>
            {wargaList.map(w => (
              <option key={w.id} value={w.id}>{w.nama_lengkap}</option>
            ))}
          </select>
          {wargaList.length === 0 && !fetching && (
            <p style={{ color: '#e74c3c', fontSize: '11px', marginTop: '5px' }}>
              ⚠️ Data warga {dawisDbPattern} tidak ditemukan di database.
            </p>
          )}
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
            <label style={labelS}>Nominal (Rp)</label>
            <input type="number" style={inputS} value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} placeholder="Contoh: 20000" required />
          </div>
        </div>

        <div>
          <label style={labelS}>Keterangan</label>
          <input type="text" style={inputS} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} placeholder="Misal: Iuran Februari" />
        </div>

        <button type="submit" disabled={loading || wargaList.length === 0} style={{...btnS, opacity: (loading || wargaList.length === 0) ? 0.6 : 1}}>
          {loading ? 'Menyimpan...' : 'Simpan Setoran'}
        </button>
      </form>
    </div>
  );
};

const labelS = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#34495e' };
const inputS = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #dfe6e9', boxSizing: 'border-box', outline: 'none', fontSize: '14px' };
const btnS = { padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '16px' };

export default InputIuran;
