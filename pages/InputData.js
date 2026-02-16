import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputData = ({ role }) => {
  const [fWarga, setFWarga] = useState({ nama_lengkap: '', status_rumah: 'Tetap' });
  const [fKas, setFKas] = useState({ nominal: '', kategori_kas: 'RT', jenis_transaksi: 'Pemasukan', keterangan: '' });

  const isDawis = role.startsWith('dawis');

  const handleWarga = async (e) => {
    e.preventDefault();
    await supabase.from('warga').insert([fWarga]);
    alert('Data Warga Disimpan!');
    setFWarga({ nama_lengkap: '', status_rumah: 'Tetap' });
  };

  const handleKas = async (e) => {
    e.preventDefault();
    await supabase.from('transaksi_kas').insert([{ ...fKas, nominal: Number(fKas.nominal), tanggal: new Date() }]);
    alert('Transaksi Kas Disimpan!');
    setFKas({ nominal: '', kategori_kas: 'RT', jenis_transaksi: 'Pemasukan', keterangan: '' });
  };

  return (
    <div>
      {/* FORM KAS: Hanya Bendahara, Ketua, Sekretaris */}
      {['bendahara', 'ketua', 'sekretaris'].includes(role) && (
        <div style={card}>
          <h4>📝 Catat Transaksi Kas</h4>
          <form onSubmit={handleKas}>
            <select onChange={e => setFKas({...fKas, kategori_kas: e.target.value})} style={inp}>
              <option value="RT">Untuk Kas RT</option>
              <option value="KGR">Untuk Kas KGR</option>
            </select>
            <input type="number" placeholder="Nominal Rp" required value={fKas.nominal} onChange={e => setFKas({...fKas, nominal: e.target.value})} style={inp} />
            <input type="text" placeholder="Keterangan (Contoh: Iuran Jan)" required value={fKas.keterangan} onChange={e => setFKas({...fKas, keterangan: e.target.value})} style={inp} />
            <select onChange={e => setFKas({...fKas, jenis_transaksi: e.target.value})} style={inp}>
              <option value="Pemasukan">Pemasukan (Uang Masuk)</option>
              <option value="Pengeluaran">Pengeluaran (Uang Keluar)</option>
            </select>
            <button type="submit" style={btn}>SIMPAN KAS</button>
          </form>
        </div>
      )}

      {/* FORM WARGA: Dawis, Sekretaris, Ketua */}
      {(isDawis || ['sekretaris', 'ketua'].includes(role)) && (
        <div style={card}>
          <h4>👤 Tambah Warga Baru</h4>
          <form onSubmit={handleWarga}>
            <input type="text" placeholder="Nama Lengkap" required value={fWarga.nama_lengkap} onChange={e => setFWarga({...fWarga, nama_lengkap: e.target.value})} style={inp} />
            <select onChange={e => setFWarga({...fWarga, status_rumah: e.target.value})} style={inp}>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
            </select>
            <button type="submit" style={{ ...btn, background: '#27ae60' }}>SIMPAN WARGA</button>
          </form>
        </div>
      )}
    </div>
  );
};

const card = { background: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #eee' };
const inp = { width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' };
const btn = { width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' };

export default InputData;
