import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [iuranData, setIuranData] = useState({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const roleNumber = user.role.replace('dawis', '');
  const toRomawi = (n) => ({1:'I', 2:'II', 3:'III', 4:'IV', 5:'V', 6:'VI'}[n] || n);
  const dawisLabel = `DAWIS ${toRomawi(roleNumber)}`;

  useEffect(() => { fetchWarga(); }, [user.role]);

  const fetchWarga = async () => {
    const { data } = await supabase.from('warga').select('id, nama_lengkap').eq('dawis', dawisLabel).order('nama_lengkap', { ascending: true });
    if (data) {
      setWargaList(data);
      const initial = {};
      data.forEach(w => { initial[w.id] = { rt: '', kgr: '' }; });
      setIuranData(initial);
    }
  };

  const handleInputChange = (id, field, val) => {
    setIuranData(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const handleSubmitBatch = async () => {
    const payloads = [];
    const bundelId = `${tanggal.replace(/-/g, '')}-D${roleNumber}-${Date.now().toString().slice(-4)}`;

    Object.keys(iuranData).forEach(wId => {
      const { rt, kgr } = iuranData[wId];
      const nama = wargaList.find(w => w.id === wId)?.nama_lengkap;
      
      const entry = (tipe, jml) => ({
        tipe_kas: tipe, jenis: 'Masuk', jumlah: parseFloat(jml),
        keterangan: `Iuran ${tipe} - ${nama}`, warga_id: wId,
        pj: user.username, status: 'PENDING', bundel_id: bundelId, created_at: tanggal
      });

      if (rt > 0) payloads.push(entry('RT', rt));
      if (kgr > 0) payloads.push(entry('KGR', kgr));
    });

    if (payloads.length === 0) return alert("Isi nominal dulu!");
    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert(payloads);
    if (!error) {
      alert("✅ Berhasil dikirim! Status: PENDING (Menunggu Bendahara)");
      fetchWarga();
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
      <div style={{ background: '#2c3e50', color: 'white', padding: '20px' }}>
        <h3 style={{ margin: 0 }}>📖 Buku Iuran {dawisLabel}</h3>
        <div style={{ marginTop: '15px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>Tanggal Setoran:</label>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} style={dateInputS} />
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
            <th style={thS}>Nama Warga</th>
            <th style={thS}>RT (Rp)</th>
            <th style={thS}>KGR (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {wargaList.map(w => (
            <tr key={w.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
              <td style={{ ...tdS, fontWeight: 'bold' }}>{w.nama_lengkap}</td>
              <td style={tdS}><input type="number" style={tiS} value={iuranData[w.id]?.rt || ''} onChange={e => handleInputChange(w.id, 'rt', e.target.value)} placeholder="0" /></td>
              <td style={tdS}><input type="number" style={tiS} value={iuranData[w.id]?.kgr || ''} onChange={e => handleInputChange(w.id, 'kgr', e.target.value)} placeholder="0" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ padding: '20px', textAlign: 'center' }}>
        <button onClick={handleSubmitBatch} disabled={loading} style={btnS}>
          {loading ? 'Mengirim...' : 'KIRIM SETORAN KE BENDAHARA'}
        </button>
      </div>
    </div>
  );
};

const dateInputS = { padding: '8px', borderRadius: '5px', border: 'none', width: '100%', maxWidth: '200px' };
const thS = { padding: '12px', textAlign: 'left', fontSize: '12px', color: '#7f8c8d' };
const tdS = { padding: '10px' };
const tiS = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'right' };
const btnS = { width: '100%', padding: '15px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

export default InputIuran;
