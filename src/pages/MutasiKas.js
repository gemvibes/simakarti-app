import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const MutasiKas = ({ user }) => {
  const [mutasi, setMutasi] = useState([]);
  const [form, setForm] = useState({ tipe_kas: 'RT', jenis: 'Masuk', jumlah: '', keterangan: '' });
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('APPROVED');

  const isBendahara = user.role === 'bendahara' || user.role === 'ketua';

  useEffect(() => {
    fetchMutasi();
  }, []);

  const fetchMutasi = async () => {
    const { data, error } = await supabase
      .from('mutasi_kas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setMutasi(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert([{
      tipe_kas: form.tipe_kas,
      jenis: form.jenis,
      jumlah: parseFloat(form.jumlah),
      keterangan: form.keterangan,
      pj: user.username,
      status: 'APPROVED' // Bendahara input langsung APPROVED
    }]);

    if (!error) {
      setForm({ tipe_kas: 'RT', jenis: 'Masuk', jumlah: '', keterangan: '' });
      fetchMutasi();
      alert('Transaksi Berhasil Dicatat!');
    } else {
      alert('Gagal mencatat: ' + error.message);
    }
    setLoading(false);
  };

  // Hitung saldo HANYA dari yang APPROVED
  const hitungSaldo = (tipe) => {
    return mutasi
      .filter(item => item.tipe_kas === tipe && item.status === 'APPROVED')
      .reduce((acc, curr) => curr.jenis === 'Masuk' ? acc + Number(curr.jumlah) : acc - Number(curr.jumlah), 0);
  };

  const hitungPending = (tipe) => {
    return mutasi
      .filter(item => item.tipe_kas === tipe && item.status === 'PENDING')
      .reduce((acc, curr) => acc + Number(curr.jumlah), 0);
  };

  const mutasiTampil = mutasi.filter(item => filterStatus === 'SEMUA' ? true : item.status === filterStatus);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>💰 Laporan Keuangan RT 03</h3>

      {/* BOX SALDO */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', marginTop: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px', padding: '20px', background: '#27ae60', color: 'white', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>✅ Saldo Kas RT (Riil)</p>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>Rp {hitungSaldo('RT').toLocaleString('id-ID')}</h2>
          {isBendahara && <p style={{ margin: '5px 0 0 0', fontSize: '11px', opacity: 0.8 }}>+ Rp {hitungPending('RT').toLocaleString('id-ID')} pending</p>}
        </div>
        <div style={{ flex: 1, minWidth: '200px', padding: '20px', background: '#2980b9', color: 'white', borderRadius: '12px' }}>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>✅ Saldo Kas KGR (Riil)</p>
          <h2 style={{ margin: '5px 0 0 0', fontSize: '20px' }}>Rp {hitungSaldo('KGR').toLocaleString('id-ID')}</h2>
          {isBendahara && <p style={{ margin: '5px 0 0 0', fontSize: '11px', opacity: 0.8 }}>+ Rp {hitungPending('KGR').toLocaleString('id-ID')} pending</p>}
        </div>
      </div>

      {/* FORM INPUT (Hanya Bendahara/Ketua) */}
      {isBendahara && (
        <div style={{ background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '25px', border: '1px solid #ddd' }}>
          <h4 style={{ marginTop: 0 }}>➕ Tambah Transaksi Langsung</h4>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select style={inputS} value={form.tipe_kas} onChange={e => setForm({ ...form, tipe_kas: e.target.value })}>
                <option value="RT">Kas Umum RT</option>
                <option value="KGR">Kas Kematian (KGR)</option>
              </select>
              <select style={inputS} value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}>
                <option value="Masuk">Uang Masuk</option>
                <option value="Keluar">Uang Keluar</option>
              </select>
            </div>
            <input type="number" placeholder="Jumlah (Rp)" style={inputS} value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} required />
            <input type="text" placeholder="Keterangan (Contoh: Beli Sapu, Dana Sosial)" style={inputS} value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} required />
            <button type="submit" disabled={loading} style={btnS}>
              {loading ? 'Proses...' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>
      )}

      {/* FILTER STATUS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, alignSelf: 'center', marginRight: '5px' }}>📜 Riwayat:</h4>
        {['APPROVED', 'PENDING', 'SEMUA'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', background: filterStatus === s ? '#2c3e50' : '#f0f0f0', color: filterStatus === s ? 'white' : '#555' }}>
            {s === 'APPROVED' ? '✅ Disetujui' : s === 'PENDING' ? '⏳ Pending' : '📋 Semua'}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto', background: 'white', borderRadius: '8px', border: '1px solid #eee' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
              <th style={thS}>Tanggal</th>
              <th style={thS}>Kas</th>
              <th style={thS}>Keterangan</th>
              <th style={thS}>Status</th>
              <th style={thS}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {mutasiTampil.length === 0 && (
              <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>Tidak ada data.</td></tr>
            )}
            {mutasiTampil.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                <td style={tdS}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td>
                <td style={tdS}><span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '10px', background: item.tipe_kas === 'RT' ? '#e8f5e9' : '#e3f2fd' }}>{item.tipe_kas}</span></td>
                <td style={tdS}>{item.keterangan}</td>
                <td style={tdS}>
                  <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: item.status === 'APPROVED' ? '#d5f5e3' : '#fef9e7', color: item.status === 'APPROVED' ? '#27ae60' : '#e67e22' }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ ...tdS, color: item.jenis === 'Masuk' ? '#27ae60' : '#e74c3c', fontWeight: 'bold' }}>
                  {item.jenis === 'Masuk' ? '+' : '-'} Rp {Number(item.jumlah).toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const inputS = { padding: '12px', borderRadius: '6px', border: '1px solid #ddd', flex: 1, minWidth: '150px' };
const btnS = { padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' };
const thS = { padding: '12px', fontSize: '13px', color: '#666' };
const tdS = { padding: '12px', fontSize: '14px' };

export default MutasiKas;
