import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const MutasiKas = ({ user }) => {
  const [mutasi, setMutasi] = useState([]);
  const [form, setForm] = useState({ tipe_kas: 'RT', jenis: 'Masuk', jumlah: '', keterangan: '' });
  const [loading, setLoading] = useState(false);

  const isBendahara = user.role === 'bendahara' || user.role === 'ketua';

  useEffect(() => {
    fetchMutasi();
  }, []);

  const fetchMutasi = async () => {
    const { data, error } = await supabase
      .from('mutasi_kas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setMutasi(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert([
      { 
        tipe_kas: form.tipe_kas, 
        jenis: form.jenis, 
        jumlah: parseFloat(form.jumlah), 
        keterangan: form.keterangan,
        pj: user.username 
      }
    ]);

    if (!error) {
      setForm({ tipe_kas: 'RT', jenis: 'Masuk', jumlah: '', keterangan: '' });
      fetchMutasi();
      alert("Transaksi Berhasil Dicatat!");
    } else {
      alert("Gagal mencatat: " + error.message);
    }
    setLoading(false);
  };

  const hitungSaldo = (tipe) => {
    return mutasi
      .filter(item => item.tipe_kas === tipe)
      .reduce((acc, curr) => curr.jenis === 'Masuk' ? acc + curr.jumlah : acc - curr.jumlah, 0);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>💰 Laporan Keuangan RT 03</h3>

      {/* BOX SALDO */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1, padding: '20px', background: '#27ae60', color: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>Saldo Kas Umum RT</p>
          <h2 style={{ margin: '5px 0 0 0' }}>Rp {hitungSaldo('RT').toLocaleString('id-ID')}</h2>
        </div>
        <div style={{ flex: 1, padding: '20px', background: '#2980b9', color: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>Saldo Kas KGR</p>
          <h2 style={{ margin: '5px 0 0 0' }}>Rp {hitungSaldo('KGR').toLocaleString('id-ID')}</h2>
        </div>
      </div>

      {/* FORM INPUT (Hanya Bendahara/Ketua) */}
      {isBendahara && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #ddd' }}>
          <h4 style={{ marginTop: 0 }}>➕ Tambah Transaksi</h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={inputS} value={form.tipe_kas} onChange={e => setForm({...form, tipe_kas: e.target.value})}>
                <option value="RT">Kas Umum RT</option>
                <option value="KGR">Kas Kematian (KGR)</option>
              </select>
              <select style={inputS} value={form.jenis} onChange={e => setForm({...form, jenis: e.target.value})}>
                <option value="Masuk">Uang Masuk</option>
                <option value="Keluar">Uang Keluar</option>
              </select>
            </div>
            <input type="number" placeholder="Jumlah (Rp)" style={inputS} value={form.jumlah} onChange={e => setForm({...form, jumlah: e.target.value})} required />
            <input type="text" placeholder="Keterangan (Contoh: Iuran Bulanan, Beli Sapu)" style={inputS} value={form.keterangan} onChange={e => setForm({...form, keterangan: e.target.value})} required />
            <button type="submit" disabled={loading} style={btnS}>
              {loading ? 'Proses...' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>
      )}

      {/* TABEL RIWAYAT */}
      <h4>📜 Riwayat Transaksi Terbaru</h4>
      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              <th style={thS}>Tanggal</th>
              <th style={thS}>Kas</th>
              <th style={thS}>Keterangan</th>
              <th style={thS}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {mutasi.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                <td style={tdS}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                <td style={tdS}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: item.tipe_kas === 'RT' ? '#e8f5e9' : '#e3f2fd' }}>{item.tipe_kas}</span></td>
                <td style={tdS}>{item.keterangan}</td>
                <td style={{ ...tdS, color: item.jenis === 'Masuk' ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                  {item.jenis === 'Masuk' ? '+' : '-'} {item.jumlah.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputS = { padding: '12px', borderRadius: '6px', border: '1px solid #ddd', flex: 1 };
const btnS = { padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const thS = { padding: '12px', fontSize: '13px', color: '#666' };
const tdS = { padding: '12px', fontSize: '14px' };

export default MutasiKas;
