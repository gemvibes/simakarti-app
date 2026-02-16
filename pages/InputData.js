import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputData = ({ role }) => {
  const [formWarga, setFormWarga] = useState({ nama_lengkap: '', status_rumah: 'Tetap' });
  const [formKas, setFormKas] = useState({ nominal: '', kategori_kas: 'RT', jenis_transaksi: 'Pemasukan', keterangan: '' });

  const saveWarga = async (e) => {
    e.preventDefault();
    await supabase.from('warga').insert([formWarga]);
    alert('Warga Disimpan!');
  };

  const saveKas = async (e) => {
    e.preventDefault();
    await supabase.from('transaksi_kas').insert([{ ...formKas, nominal: Number(formKas.nominal), tanggal: new Date() }]);
    alert('Transaksi Disimpan!');
  };

  return (
    <div>
      {/* Bendahara hanya bisa input Kas */}
      {['bendahara', 'ketua'].includes(role) && (
        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <h4>Input Kas (RT/KGR)</h4>
          <form onSubmit={saveKas}>
            <select onChange={e => setFormKas({...formKas, kategori_kas: e.target.value})} style={inp}>
              <option value="RT">Kas RT</option>
              <option value="KGR">Kas KGR</option>
            </select>
            <input type="number" placeholder="Nominal" onChange={e => setFormKas({...formKas, nominal: e.target.value})} style={inp} />
            <input type="text" placeholder="Keterangan" onChange={e => setFormKas({...formKas, keterangan: e.target.value})} style={inp} />
            <button type="submit" style={btn}>Simpan Kas</button>
          </form>
        </div>
      )}

      {/* Sekretaris & Dawis bisa input Warga */}
      {['sekretaris', 'dawis', 'ketua'].includes(role) && (
        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '10px' }}>
          <h4>Input Data Warga</h4>
          <form onSubmit={saveWarga}>
            <input type="text" placeholder="Nama Lengkap" onChange={e => setFormWarga({...formWarga, nama_lengkap: e.target.value})} style={inp} />
            <select onChange={e => setFormWarga({...formWarga, status_rumah: e.target.value})} style={inp}>
              <option value="Tetap">Tetap</option>
              <option value="Kontrak">Kontrak</option>
            </select>
            <button type="submit" style={{ ...btn, background: '#27ae60' }}>Simpan Warga</button>
          </form>
        </div>
      )}
    </div>
  );
};

const inp = { width: '100%', padding: '8px', marginBottom: '10px' };
const btn = { width: '100%', padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px' };

export default InputData;
