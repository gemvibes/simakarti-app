import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [iuranData, setIuranData] = useState({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [riwayat, setRiwayat] = useState([]);
  const [editBundel, setEditBundel] = useState(null); // bundel yang sedang diedit
  const [tab, setTab] = useState('input'); // 'input' | 'riwayat'

  const roleNumber = user.role.replace('dawis', '');
  const toRomawi = (n) => ({ 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' }[parseInt(n)] || n);
  const dawisLabel = `DAWIS ${toRomawi(roleNumber)}`;

  useEffect(() => { fetchWarga(); fetchRiwayat(); }, [user.role]);

  const fetchWarga = async () => {
    const { data } = await supabase
      .from('warga')
      .select('id, nama_lengkap, nominal_rt_standar, nominal_kgr_standar')
      .eq('dawis', dawisLabel)
      .eq('is_active', true)
      .order('nama_lengkap', { ascending: true });

    if (data) {
      setWargaList(data);
      const initial = {};
      data.forEach(w => {
        initial[w.id] = {
          rt: w.nominal_rt_standar ? String(w.nominal_rt_standar) : '',
          kgr: w.nominal_kgr_standar ? String(w.nominal_kgr_standar) : ''
        };
      });
      setIuranData(initial);
    }
  };

  const fetchRiwayat = async () => {
    const { data } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('pj', user.username)
      .order('created_at', { ascending: false });

    if (data) {
      // Kelompokkan per bundel
      const grouped = data.reduce((acc, item) => {
        const key = item.bundel_id || item.id;
        if (!acc[key]) {
          acc[key] = { bundel_id: item.bundel_id, id: key, status: item.status, tgl: item.created_at, items: [], total: 0 };
        }
        acc[key].items.push(item);
        acc[key].total += Number(item.jumlah);
        return acc;
      }, {});
      setRiwayat(Object.values(grouped).sort((a, b) => new Date(b.tgl) - new Date(a.tgl)));
    }
  };

  const handleInputChange = (id, field, val) => {
    setIuranData(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const resetForm = () => {
    setEditBundel(null);
    const initial = {};
    wargaList.forEach(w => {
      initial[w.id] = {
        rt: w.nominal_rt_standar ? String(w.nominal_rt_standar) : '',
        kgr: w.nominal_kgr_standar ? String(w.nominal_kgr_standar) : ''
      };
    });
    setIuranData(initial);
    setTanggal(new Date().toISOString().split('T')[0]);
  };

  const bukaEditBundel = async (bundel) => {
    if (bundel.status !== 'PENDING') {
      alert('Setoran yang sudah APPROVED tidak bisa diedit. Minta Bendahara untuk menolak terlebih dahulu.');
      return;
    }
    setEditBundel(bundel);
    setTab('input');
    // Isi form dengan data dari bundel
    const newData = {};
    wargaList.forEach(w => { newData[w.id] = { rt: '', kgr: '' }; });
    bundel.items.forEach(item => {
      if (item.warga_id && newData[item.warga_id] !== undefined) {
        if (item.tipe_kas === 'RT') newData[item.warga_id].rt = String(item.jumlah);
        if (item.tipe_kas === 'KGR') newData[item.warga_id].kgr = String(item.jumlah);
      }
    });
    setIuranData(newData);
    // Ambil tanggal dari bundel
    setTanggal(bundel.tgl ? bundel.tgl.split('T')[0] : new Date().toISOString().split('T')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitBatch = async () => {
    const payloads = [];
    const bundelId = editBundel?.bundel_id || `${tanggal.replace(/-/g, '')}-D${roleNumber}-${Date.now().toString().slice(-4)}`;

    Object.keys(iuranData).forEach(wId => {
      const { rt, kgr } = iuranData[wId];
      const nama = wargaList.find(w => w.id === wId)?.nama_lengkap;
      const entry = (tipe, jml) => ({
        tipe_kas: tipe, jenis: 'Masuk', jumlah: parseFloat(jml),
        keterangan: `Iuran ${tipe} - ${nama}`, warga_id: wId,
        pj: user.username, status: 'PENDING', bundel_id: bundelId, created_at: tanggal
      });
      if (parseFloat(rt) > 0) payloads.push(entry('RT', rt));
      if (parseFloat(kgr) > 0) payloads.push(entry('KGR', kgr));
    });

    if (payloads.length === 0) return alert('Isi nominal dulu!');
    setLoading(true);

    if (editBundel) {
      // Hapus data lama lalu insert baru
      if (editBundel.bundel_id) {
        await supabase.from('mutasi_kas').delete().eq('bundel_id', editBundel.bundel_id);
      } else {
        const ids = editBundel.items.map(i => i.id);
        await supabase.from('mutasi_kas').delete().in('id', ids);
      }
    }

    const { error } = await supabase.from('mutasi_kas').insert(payloads);
    if (!error) {
      alert(editBundel ? '✅ Setoran berhasil diperbarui!' : '✅ Berhasil dikirim! Status: PENDING (Menunggu Bendahara)');
      resetForm();
      fetchRiwayat();
      setTab('riwayat');
    } else {
      alert('Gagal: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      {/* TAB */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        {[['input', '📝 Input Setoran'], ['riwayat', '📋 Riwayat Setoran']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'input' && !editBundel) resetForm(); }}
            style={{ padding: '10px 18px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === key ? '#2c3e50' : '#f0f0f0', color: tab === key ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ====== TAB INPUT ====== */}
      {tab === 'input' && (
        <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ background: editBundel ? '#e67e22' : '#2c3e50', color: 'white', padding: '20px' }}>
            <h3 style={{ margin: 0 }}>
              {editBundel ? `✏️ Edit Setoran ${dawisLabel}` : `📖 Buku Iuran ${dawisLabel}`}
            </h3>
            {editBundel && (
              <div style={{ marginTop: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                ⚠️ Mode Edit — data lama akan diganti. <button onClick={resetForm} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}>Batal Edit</button>
              </div>
            )}
            <div style={{ marginTop: '12px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>Tanggal Setoran:</label>
              <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
                style={{ padding: '8px', borderRadius: '5px', border: 'none', maxWidth: '200px' }} />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={thS}>Nama Warga</th>
                <th style={thS}>Iuran RT (Rp)</th>
                <th style={thS}>Iuran KGR (Rp)</th>
              </tr>
            </thead>
            <tbody>
              {wargaList.map(w => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '13px' }}>{w.nama_lengkap}</td>
                  <td style={{ padding: '8px' }}>
                    <input type="number" style={tiS} value={iuranData[w.id]?.rt || ''}
                      onChange={e => handleInputChange(w.id, 'rt', e.target.value)} placeholder="0" />
                  </td>
                  <td style={{ padding: '8px' }}>
                    <input type="number" style={tiS} value={iuranData[w.id]?.kgr || ''}
                      onChange={e => handleInputChange(w.id, 'kgr', e.target.value)} placeholder="0" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ringkasan total */}
          <div style={{ padding: '10px 20px', background: '#f8f9fa', borderTop: '1px solid #eee', display: 'flex', gap: '20px', fontSize: '13px' }}>
            <span>Total RT: <strong style={{ color: '#27ae60' }}>Rp {Object.values(iuranData).reduce((s, v) => s + (parseFloat(v.rt) || 0), 0).toLocaleString('id-ID')}</strong></span>
            <span>Total KGR: <strong style={{ color: '#2980b9' }}>Rp {Object.values(iuranData).reduce((s, v) => s + (parseFloat(v.kgr) || 0), 0).toLocaleString('id-ID')}</strong></span>
          </div>

          <div style={{ padding: '20px' }}>
            <button onClick={handleSubmitBatch} disabled={loading}
              style={{ width: '100%', padding: '15px', background: editBundel ? '#e67e22' : '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              {loading ? 'Mengirim...' : (editBundel ? 'PERBARUI SETORAN' : 'KIRIM SETORAN KE BENDAHARA')}
            </button>
          </div>
        </div>
      )}

      {/* ====== TAB RIWAYAT ====== */}
      {tab === 'riwayat' && (
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📋 Riwayat Setoran {dawisLabel}</h3>
          {riwayat.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>
              Belum ada riwayat setoran.
            </div>
          ) : (
            riwayat.map(b => (
              <div key={b.id} style={{ background: 'white', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `5px solid ${b.status === 'APPROVED' ? '#27ae60' : '#f39c12'}` }}>
                <div style={{ padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      {new Date(b.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', marginTop: '3px' }}>
                      Rp {b.total.toLocaleString('id-ID')}
                      <span style={{ marginLeft: '10px', fontSize: '11px', padding: '3px 10px', borderRadius: '10px', fontWeight: 'bold', background: b.status === 'APPROVED' ? '#d5f5e3' : '#fef9e7', color: b.status === 'APPROVED' ? '#27ae60' : '#e67e22' }}>
                        {b.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '4px' }}>{b.items.length} transaksi</div>
                  </div>
                  {b.status === 'PENDING' && (
                    <button onClick={() => bukaEditBundel(b)}
                      style={{ background: '#e67e22', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                      ✏️ Edit Setoran
                    </button>
                  )}
                  {b.status === 'APPROVED' && (
                    <span style={{ fontSize: '12px', color: '#27ae60' }}>✅ Sudah diterima Bendahara</span>
                  )}
                </div>
                {/* Rincian item */}
                <div style={{ borderTop: '1px solid #f1f1f1', padding: '10px 15px', background: '#fafafa' }}>
                  {b.items.map(item => (
                    <div key={item.id} style={{ fontSize: '12px', color: '#555', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{item.keterangan}</span>
                      <span style={{ fontWeight: 'bold', color: item.tipe_kas === 'RT' ? '#27ae60' : '#2980b9' }}>
                        [{item.tipe_kas}] Rp {Number(item.jumlah).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const thS = { padding: '12px', textAlign: 'left', fontSize: '12px', color: '#7f8c8d' };
const tiS = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'right', boxSizing: 'border-box' };

export default InputIuran;
