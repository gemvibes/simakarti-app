import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputData = ({ role }) => {
  const [fw, setFw] = useState({ nama_lengkap: '', status_rumah: 'Tetap' });
  const [fk, setFk] = useState({ nominal: '', kategori_kas: 'RT', jenis_transaksi: 'Pemasukan', keterangan: '' });
  const [ft, setFt] = useState({ nama_toko: '', pemilik: '', jenis_usaha: '' });

  const saveKas = async (e) => {
    e.preventDefault();
    await supabase.from('transaksi_kas').insert([{ ...fk, nominal: Number(fk.nominal), tanggal: new Date() }]);
    alert('Kas Berhasil Dicatat!');
    setFk({ nominal: '', kategori_kas: 'RT', jenis_transaksi: 'Pemasukan', keterangan: '' });
  };

  const saveToko = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('toko_warga').insert([ft]);
    if (error) alert("Gagal: " + error.message);
    else { alert('Data Toko Disimpan!'); setFt({ nama_toko: '', pemilik: '', jenis_usaha: '' }); }
  };

  return (
    <div>
      {/* KHUSUS HUMAS & KETUA: Input Toko */}
      {(role === 'humas' || role === 'ketua') && (
        <div style={card}>
          <h4>🏪 Input Data Toko/UMKM (Humas)</h4>
          <form onSubmit={saveToko}>
            <input type="text" placeholder="Nama Toko" style={inS} value={ft.nama_toko} onChange={e => setFt({...ft, nama_toko: e.target.value})} required />
            <input type="text" placeholder="Nama Pemilik" style={inS} value={ft.pemilik} onChange={e => setFt({...ft, pemilik: e.target.value})} required />
            <input type="text" placeholder="Jenis Usaha (Sembako/Jasa/dll)" style={inS} value={ft.jenis_usaha} onChange={e => setFt({...ft, jenis_usaha: e.target.value})} required />
            <button type="submit" style={{ ...btS, background: '#f39c12' }}>SIMPAN DATA TOKO</button>
          </form>
        </div>
      )}

      {/* KHUSUS BENDAHARA & KETUA: Input Kas */}
      {['bendahara', 'ketua'].includes(role) && (
        <div style={card}>
          <h4>💰 Catat Kas (RT/KGR)</h4>
          <form onSubmit={saveKas}>
            <select style={inS} onChange={e => setFk({...fk, kategori_kas: e.target.value})}>
              <option value="RT">Kas Umum RT</option>
              <option value="KGR">Kas Kematian (KGR)</option>
            </select>
            <input type="number" placeholder="Nominal" style={inS} value={fk.nominal} onChange={e => setFk({...fk, nominal: e.target.value})} required />
            <input type="text" placeholder="Keterangan" style={inS} value={fk.keterangan} onChange={e => setFk({...fk, keterangan: e.target.value})} required />
            <button type="submit" style={btS}>SIMPAN TRANSAKSI</button>
          </form>
        </div>
      )}
    </div>
  );
};
const card = { background: '#f9f9f9', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #eee' };
const inS = { width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btS = { width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };
export default InputData;
