import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DAWIS_OPTIONS = ['DAWIS I', 'DAWIS II', 'DAWIS III', 'DAWIS IV', 'DAWIS V', 'DAWIS VI', 'TOKO'];

const emptyForm = {
  nama_lengkap: '',
  dawis: 'DAWIS I',
  tipe_subjek: 'Warga',
  status_rumah: 'Tetap',
  nominal_rt_standar: '',
  nominal_kgr_standar: ''
};

const DataWarga = ({ user }) => {
  const [warga, setWarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = tambah baru, obj = edit
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const isAdmin = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => {
    fetchWarga();
  }, []);

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
  };

  const bukaEdit = (w) => {
    setEditTarget(w);
    setFormData({
      nama_lengkap: w.nama_lengkap || '',
      dawis: w.dawis || 'DAWIS I',
      tipe_subjek: w.tipe_subjek || 'Warga',
      status_rumah: w.status_rumah || 'Tetap',
      nominal_rt_standar: w.nominal_rt_standar || '',
      nominal_kgr_standar: w.nominal_kgr_standar || ''
    });
    setShowForm(true);
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
      nama_lengkap: formData.nama_lengkap,
      dawis: formData.dawis,
      tipe_subjek: formData.tipe_subjek,
      status_rumah: formData.status_rumah,
      nominal_rt_standar: parseFloat(formData.nominal_rt_standar) || 0,
      nominal_kgr_standar: parseFloat(formData.nominal_kgr_standar) || 0
    };

    let error;
    if (editTarget) {
      // Mode Edit
      ({ error } = await supabase.from('warga').update(payload).eq('id', editTarget.id));
    } else {
      // Mode Tambah Baru
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
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${nama}? (Data iuran lama tetap tersimpan)`)) {
      const { error } = await supabase.from('warga').update({ is_active: false }).eq('id', id);
      if (!error) {
        alert('Warga berhasil dinonaktifkan.');
        fetchWarga();
      }
    }
  };

  const filteredWarga = warga.filter(w =>
    w.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.dawis || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data warga...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0 }}>👥 Data Warga & Toko RT 03 <span style={{ fontSize: '14px', color: '#7f8c8d' }}>({filteredWarga.length} orang)</span></h3>
        {isAdmin && (
          <button
            onClick={bukaTambahBaru}
            style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Tambah Baru
          </button>
        )}
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {showForm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: '#2c3e50' }}>{editTarget ? '✏️ Edit Data Warga' : '➕ Tambah Warga Baru'}</h4>
              <button onClick={tutupForm} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#e74c3c' }}>✖</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={fGroup}>
                <label style={fLabel}>Nama Lengkap *</label>
                <input type="text" required style={fInput} value={formData.nama_lengkap}
                  onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Masukkan nama lengkap" />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ ...fGroup, flex: 1 }}>
                  <label style={fLabel}>Dawis / Kelompok *</label>
                  <select style={fInput} value={formData.dawis} onChange={e => setFormData({ ...formData, dawis: e.target.value })}>
                    {DAWIS_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={{ ...fGroup, flex: 1 }}>
                  <label style={fLabel}>Tipe</label>
                  <select style={fInput} value={formData.tipe_subjek} onChange={e => setFormData({ ...formData, tipe_subjek: e.target.value })}>
                    <option value="Warga">Warga</option>
                    <option value="Toko">Toko / Usaha</option>
                  </select>
                </div>
              </div>
              <div style={{ ...fGroup }}>
                <label style={fLabel}>Status Rumah</label>
                <select style={fInput} value={formData.status_rumah} onChange={e => setFormData({ ...formData, status_rumah: e.target.value })}>
                  <option value="Tetap">Tetap</option>
                  <option value="Kontrak">Kontrak / Sewa</option>
                </select>
              </div>
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
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={tutupForm} style={{ flex: 1, padding: '12px', background: '#bdc3c7', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Menyimpan...' : (editTarget ? 'SIMPAN PERUBAHAN' : 'TAMBAH WARGA')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Cari nama atau dawis..."
          style={searchS}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={thS}>Nama Lengkap</th>
                <th style={thS}>Dawis</th>
                <th style={thS}>Tipe</th>
                <th style={thS}>Iuran RT</th>
                <th style={thS}>Iuran KGR</th>
                {isAdmin && <th style={thS}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #f1f1f1' }}>
                  <td style={tdS}><div style={{ fontWeight: 'bold' }}>{w.nama_lengkap}</div></td>
                  <td style={tdS}><span style={w.dawis === 'TOKO' ? badgeToko : badgeDawis}>{w.dawis}</span></td>
                  <td style={tdS}><span style={{ fontSize: '12px', color: '#7f8c8d' }}>{w.tipe_subjek || 'Warga'}</span></td>
                  <td style={tdS}><span style={{ fontSize: '13px' }}>Rp {(w.nominal_rt_standar || 0).toLocaleString('id-ID')}</span></td>
                  <td style={tdS}><span style={{ fontSize: '13px' }}>Rp {(w.nominal_kgr_standar || 0).toLocaleString('id-ID')}</span></td>
                  {isAdmin && (
                    <td style={tdS}>
                      <button onClick={() => bukaEdit(w)} style={btnEdit}>Edit</button>
                      <button onClick={() => handleSoftDelete(w.id, w.nama_lengkap)} style={btnHapus}>Hapus</button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredWarga.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} style={{ padding: '20px', textAlign: 'center', color: '#7f8c8d' }}>Tidak ada data yang cocok.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- STYLES ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const modalStyle = { background: 'white', borderRadius: '16px', padding: '30px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const fGroup = { marginBottom: '15px' };
const fLabel = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' };
const fInput = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };
const thS = { padding: '15px', textAlign: 'left', fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase' };
const tdS = { padding: '12px 15px', fontSize: '14px' };
const searchS = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', outline: 'none', boxSizing: 'border-box' };
const badgeDawis = { background: '#ebf5ff', color: '#3498db', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
const badgeToko = { background: '#fef9e7', color: '#e67e22', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' };
const btnEdit = { background: '#f39c12', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px', fontSize: '12px' };
const btnHapus = { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

export default DataWarga;
