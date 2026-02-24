import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const emptyForm = {
  nama_lengkap: '',
  nomor_rumah: '',
  nominal_rt_standar: '',
};

const DataToko = ({ user }) => {
  const [tokoList, setTokoList]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData]   = useState(emptyForm);
  const [saving, setSaving]       = useState(false);

  // humas bisa tambah & edit, ketua & sekretaris bisa semua
  const canEdit   = ['humas', 'ketua', 'sekretaris'].includes(user.role);
  const canDelete = ['ketua', 'sekretaris'].includes(user.role);

  useEffect(() => { fetchToko(); }, []);

  const fetchToko = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warga')
      .select('*')
      .eq('is_active', true)
      .eq('tipe_subjek', 'Toko')
      .order('nama_lengkap', { ascending: true });
    if (!error) setTokoList(data || []);
    setLoading(false);
  };

  const bukaTambah = () => {
    setEditTarget(null);
    setFormData(emptyForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const bukaEdit = (t) => {
    setEditTarget(t);
    setFormData({
      nama_lengkap:       t.nama_lengkap || '',
      nomor_rumah:        t.nomor_rumah || '',
      nominal_rt_standar: t.nominal_rt_standar ? String(t.nominal_rt_standar) : '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tutupForm = () => { setShowForm(false); setEditTarget(null); setFormData(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nama_lengkap:       formData.nama_lengkap.trim().toUpperCase(),
      nomor_rumah:        formData.nomor_rumah.trim(),
      tipe_subjek:        'Toko',
      dawis:              'TOKO',
      nominal_rt_standar: parseFloat(formData.nominal_rt_standar) || 0,
      nominal_kgr_standar: 0,
      status_tinggal:     null,
    };

    let error;
    if (editTarget) {
      ({ error } = await supabase.from('warga').update(payload).eq('id', editTarget.id));
    } else {
      ({ error } = await supabase.from('warga').insert([{ ...payload, is_active: true, status_rumah: 'Tetap' }]));
    }

    if (!error) {
      alert(editTarget ? '✅ Data toko berhasil diperbarui!' : '✅ Toko baru berhasil ditambahkan!');
      tutupForm();
      fetchToko();
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
    setSaving(false);
  };

  const handleHapus = async (id, nama) => {
    if (!window.confirm(`Nonaktifkan toko "${nama}"?\nRiwayat iuran tetap tersimpan.`)) return;
    const { error } = await supabase.from('warga').update({ is_active: false }).eq('id', id);
    if (!error) { alert('Toko berhasil dinonaktifkan.'); fetchToko(); }
  };

  const filtered = tokoList.filter(t =>
    !searchTerm ||
    t.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.nomor_rumah || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data toko...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* MODAL FORM */}
      {showForm && canEdit && (
        <div style={overlayS}>
          <div style={modalS}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ margin: 0, color: editTarget ? '#f59e0b' : '#8e44ad' }}>
                {editTarget ? '✏️ Edit Data Toko' : '➕ Tambah Toko Baru'}
              </h4>
              <button onClick={tutupForm} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#ef4444' }}>✖</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={fG}>
                <label style={fL}>Nama Toko / Usaha *</label>
                <input type="text" required style={fI} value={formData.nama_lengkap}
                  onChange={e => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Contoh: WARUNG BU SARI" />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Nama akan otomatis ditulis kapital</div>
              </div>
              <div style={fG}>
                <label style={fL}>Nomor / Lokasi</label>
                <input type="text" style={fI} value={formData.nomor_rumah}
                  onChange={e => setFormData({ ...formData, nomor_rumah: e.target.value })}
                  placeholder="Contoh: No. 5, Depan Masjid" />
              </div>
              <div style={fG}>
                <label style={fL}>Iuran RT Wajib per Bulan (Rp) *</label>
                <input type="number" required style={fI} value={formData.nominal_rt_standar}
                  onChange={e => setFormData({ ...formData, nominal_rt_standar: e.target.value })}
                  placeholder="Contoh: 25000" />
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Nominal ini akan menjadi default saat input iuran toko</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="button" onClick={tutupForm}
                  style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, padding: '12px', background: editTarget ? '#f59e0b' : '#8e44ad', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {saving ? 'Menyimpan...' : editTarget ? 'SIMPAN PERUBAHAN' : 'TAMBAH TOKO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, color: '#1e293b' }}>
          🏪 Data Toko & Usaha RT 03
          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'normal', marginLeft: '8px' }}>({filtered.length} toko)</span>
        </h3>
        {canEdit && (
          <button onClick={bukaTambah}
            style={{ background: '#8e44ad', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
            + Tambah Toko
          </button>
        )}
      </div>

      {/* INFO HAK AKSES */}
      <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', fontSize: '12px', color: '#6b21a8' }}>
        {user.role === 'humas'
          ? '📣 Anda login sebagai Humas — dapat menambah dan mengedit data toko.'
          : '👑 Anda memiliki akses penuh sebagai pengawas data toko.'}
      </div>

      {/* SEARCH */}
      <div style={{ marginBottom: '16px' }}>
        <input type="text" placeholder="🔍 Cari nama toko..."
          style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px', boxSizing: 'border-box' }}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* TABEL */}
      <div style={{ background: 'white', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.06)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={thS}>No.</th>
                <th style={thS}>Nama Toko / Usaha</th>
                <th style={thS}>Lokasi / No.</th>
                <th style={thS}>Iuran RT Wajib</th>
                {canEdit && <th style={thS}>Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={canEdit ? 5 : 4} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Belum ada toko terdaftar.</td></tr>
              )}
              {filtered.map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ ...tdS, color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                  <td style={{ ...tdS, fontWeight: 'bold' }}>{t.nama_lengkap}</td>
                  <td style={tdS}><span style={{ color: t.nomor_rumah ? '#1e293b' : '#cbd5e1' }}>{t.nomor_rumah || '—'}</span></td>
                  <td style={tdS}>
                    <span style={{ fontWeight: 'bold', color: '#8e44ad' }}>
                      Rp {Number(t.nominal_rt_standar || 0).toLocaleString('id-ID')}
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'normal' }}>/bln</span>
                    </span>
                  </td>
                  {canEdit && (
                    <td style={tdS}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => bukaEdit(t)} style={btnEdit}>✏️ Edit</button>
                        {canDelete && (
                          <button onClick={() => handleHapus(t.id, t.nama_lengkap)} style={btnHapus}>🗑️</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div style={{ padding: '10px 18px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8' }}>
          Total toko aktif: <strong style={{ color: '#8e44ad' }}>{tokoList.length}</strong> unit usaha
        </div>
      </div>
    </div>
  );
};

const overlayS = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' };
const modalS   = { background: 'white', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' };
const fG = { marginBottom: '14px' };
const fL = { display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '5px', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' };
const fI = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };
const thS = { padding: '12px 14px', textAlign: 'left', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' };
const tdS = { padding: '11px 14px', fontSize: '13px' };
const btnEdit  = { background: '#f59e0b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnHapus = { background: '#ef4444', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' };

export default DataToko;
