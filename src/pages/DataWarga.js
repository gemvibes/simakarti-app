import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DAWIS_OPTIONS = ['DAWIS I', 'DAWIS II', 'DAWIS III', 'DAWIS IV', 'DAWIS V', 'DAWIS VI', 'TOKO'];

const emptyForm = {
  nama_lengkap: '',
  nomor_rumah: '',
  dawis: 'DAWIS I',
  tipe_subjek: 'Warga',
  status_rumah: 'Tetap',
  nominal_rt_standar: '',
  nominal_kgr_standar: ''
};

const DataWarga = ({ user }) => {
  const [warga, setWarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState([]);
  const [filterDawis, setFilterDawis] = useState('SEMUA');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isAdmin = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => { fetchWarga(); }, []);

  const fetchWarga = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('is_active', true)
      .order('nama_lengkap', { ascending: true });
    if (!error) setWarga(data || []);
    setLoading(false);
  };

  const bukaTambahBaru = () => {
    setEditTarget(null);
    setFormData(emptyForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bukaEdit = (w) => {
    setEditTarget(w);
    setFormData({
      nama_lengkap: w.nama_lengkap || '',
      nomor_rumah: w.nomor_rumah || '',
      dawis: w.dawis || 'DAWIS I',
      tipe_subjek: w.tipe_subjek || 'Warga',
      status_rumah: w.status_rumah || 'Tetap',
      nominal_rt_standar: w.nominal_rt_standar || '',
      nominal_kgr_standar: w.nominal_kgr_standar || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tutupForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setFormData(emptyForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nama_lengkap: formData.nama_lengkap.trim(),
      nomor_rumah: formData.nomor_rumah.trim(),
      dawis: formData.dawis,
      tipe_subjek: formData.tipe_subjek,
      status_rumah: formData.status_rumah,
      nominal_rt_standar: parseFloat(formData.nominal_rt_standar) || 0,
      nominal_kgr_standar: parseFloat(formData.nominal_kgr_standar) || 0
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

  const handleSoftDelete = async (id, nama) => {
    if (!window.confirm(`Hapus "${nama}"?\nData iuran lama tetap tersimpan di sistem.`)) return;
    const { error } = await supabase.from('warga').update({ is_active: false }).eq('id', id);
    if (!error) { alert('Warga berhasil dinonaktifkan.'); fetchWarga(); }
  };

  // Filter
  const dawisUnik = ['SEMUA', ...Array.from(new Set(warga.map(w => w.dawis).filter(Boolean))).sort()];
  const filtered = warga.filter(w => {
    const cocokCari = !searchTerm ||
      w.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.nomor_rumah || '').toLowerCase().includes(searchTerm.toLowerCase());
    const cocokDawis = filterDawis === 'SEMUA' || w.dawis === filterDawis;
    return cocokCari && cocokDawis;
  });

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data warga...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* ── MODAL FORM TAMBAH / EDIT ── */}
      {showForm && isAdmin && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: editTarget ? '#f39c12' : '#27ae60' }}>
                {editTarget ? '✏️ Edit Data Warga' : '➕ Tambah Warga Baru'}
              </h4>
              <button onClick={tutupForm} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#e74c3c', lineHeight: 1 }}>✖</button>
            </div>

            <form onSubmit={handleSave}>
              {/* Nama */}
              <div style={fGroup}>
                <label style={fLabel}>Nama Lengkap *</label>
                <input type="text" required style={fInput} value={formData.nama_lengkap}
                  onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Masukkan nama lengkap" />
              </div>

              {/* Nomor Rumah */}
              <div style={fGroup}>
                <label style={fLabel}>Nomor Rumah</label>
                <input type="text" style={fInput} value={formData.nomor_rumah}
                  onChange={e => setFormData({ ...formData, nomor_rumah: e.target.value })}
                  placeholder="Contoh: 12A, 7, 45B" />
              </div>

              {/* Dawis & Tipe */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ ...fGroup, flex: 1 }}>
                  <label style={fLabel}>Dawis *</label>
                  <select style={fInput} value={formData.dawis}
                    onChange={e => setFormData({ ...formData, dawis: e.target.value })}>
                    {DAWIS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ ...fGroup, flex: 1 }}>
                  <label style={fLabel}>Tipe</label>
                  <select style={fInput} value={formData.tipe_subjek}
                    onChange={e => setFormData({ ...formData, tipe_subjek: e.target.value })}>
                    <option value="Warga">Warga</option>
                    <option value="Toko">Toko / Usaha</option>
                  </select>
                </div>
              </div>

              {/* Status Rumah */}
              <div style={fGroup}>
                <label style={fLabel}>Status Rumah</label>
                <select style={fInput} value={formData.status_rumah}
                  onChange={e => setFormData({ ...formData, status_rumah: e.target.value })}>
                  <option value="Tetap">Tetap</option>
                  <option value="Kontrak">Kontrak / Sewa</option>
                </select>
              </div>

              {/* Iuran standar (tersembunyi tapi tetap tersimpan) */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ ...fGroup, flex: 1 }}>
                  <label style={fLabel}>Iuran RT Standar (Rp)</label>
                  <input type="number" style={fInput} value={formData.nominal_rt_standar}
                    onChange={e => setFormData({ ...formData, nominal_rt_standar: e.target.value })}
                    placeholder="Contoh: 15000" />
                </div>
                <div style={{ ...fGroup, flex: 1 }}>
                  <label style={fLabel}>Iuran KGR Standar (Rp)</label>
                  <input type="number" style={fInput} value={formData.nominal_kgr_standar}
                    onChange={e => setFormData({ ...formData, nominal_kgr_standar: e.target.value })}
                    placeholder="Contoh: 5000" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <button type="button" onClick={tutupForm}
                  style={{ flex: 1, padding: '12px', background: '#bdc3c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', background: editTarget ? '#f39c12' : '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Menyimpan...' : editTarget ? 'SIMPAN PERUBAHAN' : 'TAMBAH WARGA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>
          👥 Data Warga RT 03
          <span style={{ fontSize: '14px', color: '#7f8c8d', fontWeight: 'normal', marginLeft: '8px' }}>({filtered.length} orang)</span>
        </h3>
        {isAdmin && (
          <button onClick={bukaTambahBaru}
            style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Tambah Warga
          </button>
        )}
      </div>

      {/* ── SEARCH & FILTER ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Cari nama atau nomor rumah..."
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' }}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select value={filterDawis} onChange={e => setFilterDawis(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', background: 'white' }}>
          {dawisUnik.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* ── TABEL ── */}
      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={thS}>No.</th>
                <th style={thS}>Nama Lengkap</th>
                <th style={thS}>No. Rumah</th>
                <th style={thS}>Dawis</th>
                <th style={thS}>Tipe</th>
                <th style={thS}>Status</th>
                {isAdmin && <th style={thS}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
                    Tidak ada data yang cocok.
                  </td>
                </tr>
              )}
              {filtered.map((w, idx) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f1f1f1', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ ...tdS, color: '#95a5a6', fontSize: '12px', width: '40px' }}>{idx + 1}</td>
                  <td style={tdS}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{w.nama_lengkap}</div>
                  </td>
                  <td style={tdS}>
                    <span style={{ fontSize: '14px', fontWeight: w.nomor_rumah ? 'bold' : 'normal', color: w.nomor_rumah ? '#2c3e50' : '#bdc3c7' }}>
                      {w.nomor_rumah || '—'}
                    </span>
                  </td>
                  <td style={tdS}>
                    <span style={w.dawis === 'TOKO' ? badgeToko : badgeDawis}>{w.dawis}</span>
                  </td>
                  <td style={tdS}>
                    <span style={{ fontSize: '12px', color: '#7f8c8d' }}>{w.tipe_subjek || 'Warga'}</span>
                  </td>
                  <td style={tdS}>
                    <span style={{ fontSize: '12px', color: w.status_rumah === 'Kontrak' ? '#e67e22' : '#27ae60' }}>
                      {w.status_rumah || 'Tetap'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => bukaEdit(w)} style={btnEdit}>✏️ Edit</button>
                        <button onClick={() => handleSoftDelete(w.id, w.nama_lengkap)} style={btnHapus}>🗑️</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer ringkasan */}
        <div style={{ padding: '12px 20px', background: '#f8f9fa', borderTop: '1px solid #eee', display: 'flex', gap: '20px', fontSize: '12px', color: '#7f8c8d', flexWrap: 'wrap' }}>
          <span>Total Warga: <strong style={{ color: '#2c3e50' }}>{warga.filter(w => w.tipe_subjek !== 'Toko').length}</strong></span>
          <span>Total Toko: <strong style={{ color: '#2c3e50' }}>{warga.filter(w => w.tipe_subjek === 'Toko').length}</strong></span>
          <span>Kontrak/Sewa: <strong style={{ color: '#e67e22' }}>{warga.filter(w => w.status_rumah === 'Kontrak').length}</strong></span>
        </div>
      </div>
    </div>
  );
};

// ── STYLES ──
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const modalStyle = { background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const fGroup = { marginBottom: '14px' };
const fLabel = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' };
const fInput = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };
const thS = { padding: '12px 15px', textAlign: 'left', fontSize: '11px', color: '#7f8c8d', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdS = { padding: '11px 15px', fontSize: '14px' };
const badgeDawis = { background: '#ebf5ff', color: '#3498db', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
const badgeToko = { background: '#fef9e7', color: '#e67e22', padding: '3px 9px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
const btnEdit = { background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnHapus = { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' };

export default DataWarga;
