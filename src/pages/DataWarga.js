import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const STATUS_TINGGAL = [
  'Domisili Tetap',
  'Domisili Sementara',
  'Administratif',
];

const STATUS_INFO = {
  'Domisili Tetap':     { desc: 'KTP RT 03 & tinggal di RT 03',       bg: '#d1fae5', color: '#065f46' },
  'Domisili Sementara': { desc: 'KTP luar & tinggal di RT 03',         bg: '#fef9c3', color: '#854d0e' },
  'Administratif':      { desc: 'KTP RT 03 & tinggal di luar daerah',  bg: '#e0f2fe', color: '#075985' },
};

const DAWIS_OPTIONS = ['DAWIS I','DAWIS II','DAWIS III','DAWIS IV','DAWIS V','DAWIS VI'];

const emptyForm = {
  nama_lengkap:        '',
  nomor_rumah:         '',
  dawis:               'DAWIS I',
  status_tinggal:      'Domisili Tetap',
  nominal_rt_standar:  '15000',
  nominal_kgr_standar: '5000',
};

const DataWarga = ({ user }) => {
  const [warga, setWarga]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDawis, setFilterDawis]   = useState('SEMUA');
  const [filterStatus, setFilterStatus] = useState('SEMUA');
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData]     = useState(emptyForm);
  const [saving, setSaving]         = useState(false);

  const isAdmin = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => { fetchWarga(); }, []);

  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('is_active', true)
      .eq('tipe_subjek', 'Warga')
      .order('nama_lengkap', { ascending: true });
    if (!error) setWarga(data || []);
    setLoading(false);
  };

  const bukaTambah = () => {
    setEditTarget(null);
    setFormData(emptyForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bukaEdit = (w) => {
    setEditTarget(w);
    setFormData({
      nama_lengkap:        w.nama_lengkap || '',
      nomor_rumah:         w.nomor_rumah || '',
      dawis:               w.dawis || 'DAWIS I',
      status_tinggal:      w.status_tinggal || 'Domisili Tetap',
      nominal_rt_standar:  w.nominal_rt_standar ? String(w.nominal_rt_standar) : '15000',
      nominal_kgr_standar: w.nominal_kgr_standar ? String(w.nominal_kgr_standar) : '5000',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tutupForm = () => { setShowForm(false); setEditTarget(null); setFormData(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nama_lengkap:        formData.nama_lengkap.trim(),
      nomor_rumah:         formData.nomor_rumah.trim(),
      dawis:               formData.dawis,
      tipe_subjek:         'Warga',
      status_tinggal:      formData.status_tinggal,
      nominal_rt_standar:  parseFloat(formData.nominal_rt_standar) || 0,
      nominal_kgr_standar: parseFloat(formData.nominal_kgr_standar) || 0,
    };

    let error;
    if (editTarget) {
      ({ error } = await supabase.from('warga').update(payload).eq('id', editTarget.id));
    } else {
      ({ error } = await supabase.from('warga').insert([{ ...payload, is_active: true }]));
    }

    if (!error) {
      alert(editTarget ? '✅ Data warga berhasil diperbarui!' : '✅ Warga baru berhasil ditambahkan!');
      tutupForm();
      fetchWarga();
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
    setSaving(false);
  };

  const handleHapus = async (id, nama) => {
    if (!window.confirm(`Hapus "${nama}"?\nData iuran tetap tersimpan di sistem.`)) return;
    const { error } = await supabase.from('warga').update({ is_active: false }).eq('id', id);
    if (!error) { alert('Warga berhasil dinonaktifkan.'); fetchWarga(); }
  };

  // Filter
  const dawisUnik  = ['SEMUA', ...Array.from(new Set(warga.map(w => w.dawis).filter(Boolean))).sort()];
  const statusUnik = ['SEMUA', ...STATUS_TINGGAL];

  const filtered = warga.filter(w => {
    const cocokCari   = !searchTerm ||
      w.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.nomor_rumah || '').includes(searchTerm);
    const cocokDawis  = filterDawis === 'SEMUA'  || w.dawis === filterDawis;
    const cocokStatus = filterStatus === 'SEMUA' || w.status_tinggal === filterStatus;
    return cocokCari && cocokDawis && cocokStatus;
  });

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data warga...</div>;

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

      {/* ── MODAL FORM ── */}
      {showForm && isAdmin && (
        <div style={overlayS}>
          <div style={modalS}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: editTarget ? '#f59e0b' : '#0f766e' }}>
                {editTarget ? '✏️ Edit Data Warga' : '➕ Tambah Warga Baru'}
              </h4>
              <button onClick={tutupForm} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#ef4444' }}>✖</button>
            </div>
            <form onSubmit={handleSave}>

              {/* Nama */}
              <div style={fG}>
                <label style={fL}>Nama Lengkap *</label>
                <input type="text" required style={fI}
                  value={formData.nama_lengkap}
                  onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Nama lengkap warga" />
              </div>

              {/* Nomor Rumah */}
              <div style={fG}>
                <label style={fL}>Nomor Rumah</label>
                <input type="text" style={fI}
                  value={formData.nomor_rumah}
                  onChange={e => setFormData({ ...formData, nomor_rumah: e.target.value })}
                  placeholder="Contoh: 12A" />
              </div>

              {/* Dawis */}
              <div style={fG}>
                <label style={fL}>Dawis *</label>
                <select style={fI} value={formData.dawis}
                  onChange={e => setFormData({ ...formData, dawis: e.target.value })}>
                  {DAWIS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Status Tinggal */}
              <div style={fG}>
                <label style={fL}>Status Tinggal *</label>
                <select style={fI} value={formData.status_tinggal}
                  onChange={e => setFormData({ ...formData, status_tinggal: e.target.value })}>
                  {STATUS_TINGGAL.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {/* Keterangan otomatis */}
                <div style={{ marginTop: '6px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', background: STATUS_INFO[formData.status_tinggal]?.bg, color: STATUS_INFO[formData.status_tinggal]?.color }}>
                  📌 {STATUS_INFO[formData.status_tinggal]?.desc}
                </div>
              </div>

              {/* Iuran Standar */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ ...fG, flex: 1 }}>
                  <label style={fL}>Iuran RT Standar (Rp)</label>
                  <input type="number" style={fI}
                    value={formData.nominal_rt_standar}
                    onChange={e => setFormData({ ...formData, nominal_rt_standar: e.target.value })}
                    placeholder="15000" />
                </div>
                <div style={{ ...fG, flex: 1 }}>
                  <label style={fL}>Iuran KGR Standar (Rp)</label>
                  <input type="number" style={fI}
                    value={formData.nominal_kgr_standar}
                    onChange={e => setFormData({ ...formData, nominal_kgr_standar: e.target.value })}
                    placeholder="5000" />
                </div>
              </div>

              {/* Tombol */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={tutupForm}
                  style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', background: editTarget ? '#f59e0b' : '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Menyimpan...' : editTarget ? 'SIMPAN PERUBAHAN' : 'TAMBAH WARGA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>
          👥 Data Warga RT 03
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'normal', marginLeft: '8px' }}>({filtered.length} orang)</span>
        </h3>
        {isAdmin && (
          <button onClick={bukaTambah}
            style={{ background: '#0f766e', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            + Tambah Warga
          </button>
        )}
      </div>

      {/* ── LEGENDA STATUS ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {STATUS_TINGGAL.map(s => {
          const info = STATUS_INFO[s];
          return (
            <span key={s} style={{ background: info.bg, color: info.color, padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
              {s}: {warga.filter(w => w.status_tinggal === s).length} orang
            </span>
          );
        })}
      </div>

      {/* ── FILTER ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Cari nama atau no. rumah..."
          style={{ flex: 1, minWidth: '180px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select value={filterDawis} onChange={e => setFilterDawis(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
          {dawisUnik.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', background: 'white' }}>
          {statusUnik.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── TABEL ── */}
      <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thS}>No.</th>
                <th style={thS}>Nama Lengkap</th>
                <th style={thS}>No. Rumah</th>
                <th style={thS}>Dawis</th>
                <th style={thS}>Status Tinggal</th>
                {isAdmin && <th style={thS}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Tidak ada data.</td></tr>
              )}
              {filtered.map((w, idx) => {
                const info = STATUS_INFO[w.status_tinggal] || { bg: '#f1f5f9', color: '#475569' };
                return (
                  <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ ...tdS, color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                    <td style={{ ...tdS, fontWeight: 'bold' }}>{w.nama_lengkap}</td>
                    <td style={tdS}>
                      <span style={{ fontWeight: w.nomor_rumah ? 'bold' : 'normal', color: w.nomor_rumah ? '#1e293b' : '#cbd5e1' }}>
                        {w.nomor_rumah || '—'}
                      </span>
                    </td>
                    <td style={tdS}>
                      <span style={{ background: '#eff6ff', color: '#3b82f6', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                        {w.dawis}
                      </span>
                    </td>
                    <td style={tdS}>
                      <span style={{ background: info.bg, color: info.color, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                        {w.status_tinggal || '—'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={tdS}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => bukaEdit(w)} style={btnEdit}>✏️ Edit</button>
                          <button onClick={() => handleHapus(w.id, w.nama_lengkap)} style={btnHapus}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer ringkasan */}
        <div style={{ padding: '10px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '20px', fontSize: '12px', color: '#94a3b8', flexWrap: 'wrap' }}>
          <span>Total: <strong style={{ color: '#1e293b' }}>{warga.length} warga</strong></span>
          {STATUS_TINGGAL.map(s => (
            <span key={s} style={{ color: STATUS_INFO[s].color }}>
              {s}: <strong>{warga.filter(w => w.status_tinggal === s).length}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const overlayS = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const modalS   = { background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const fG = { marginBottom: '14px' };
const fL = { display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' };
const fI = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };
const thS = { padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdS = { padding: '11px 14px', fontSize: '13px' };
const btnEdit  = { background: '#f59e0b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnHapus = { background: '#ef4444', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' };

export default DataWarga;
