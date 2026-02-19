import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const KegiatanRT = ({ user }) => {
  const [tab, setTab] = useState('kegiatan');
  const [kegiatan, setKegiatan] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [absensiData, setAbsensiData] = useState({});
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [pertemuanMap, setPertemuanMap] = useState({});
  const [rekapData, setRekapData] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  // Search daftar hadir
  const [searchHadir, setSearchHadir] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);

  const emptyForm = { nama_kegiatan: '', tanggal: new Date().toISOString().split('T')[0], notulensi: '', lokasi: 'RT 03' };
  const [formData, setFormData] = useState(emptyForm);

  const canInput = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => { fetchKegiatan(); fetchWarga(); }, []);
  useEffect(() => { if (tab === 'rekap') fetchRekap(); }, [tab]);

  // Tutup suggestion saat klik di luar
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchKegiatan = async () => {
    setLoading(true);
    const { data } = await supabase.from('kegiatan_rt').select('*').order('tanggal', { ascending: false });
    if (data) setKegiatan(data);
    setLoading(false);
  };

  const fetchWarga = async () => {
    const { data } = await supabase.from('warga').select('id, nama_lengkap, dawis').eq('is_active', true).eq('tipe_subjek', 'Warga').order('nama_lengkap', { ascending: true });
    if (data) setWargaList(data);
  };

  const fetchRekap = async () => {
    setLoadingRekap(true);
    const { data: pertemuanList } = await supabase.from('pertemuan').select('id');
    const { data: absensiList } = await supabase.from('absensi').select('warga_id, status_hadir');
    const { data: wargaData } = await supabase.from('warga').select('id, nama_lengkap, dawis').eq('is_active', true).eq('tipe_subjek', 'Warga').order('nama_lengkap', { ascending: true });
    if (!pertemuanList || !absensiList || !wargaData) { setLoadingRekap(false); return; }
    const totalKegiatan = pertemuanList.length;
    const rekap = wargaData.map(w => {
      const hadirCount = absensiList.filter(a => a.warga_id === w.id && a.status_hadir === true).length;
      const persen = totalKegiatan > 0 ? Math.round((hadirCount / totalKegiatan) * 100) : 0;
      return { id: w.id, nama: w.nama_lengkap, dawis: w.dawis, hadir: hadirCount, total: totalKegiatan, persen };
    });
    rekap.sort((a, b) => b.persen - a.persen);
    setRekapData(rekap);
    setLoadingRekap(false);
  };

  const getOrCreatePertemuan = async (k) => {
    if (pertemuanMap[k.id]) return pertemuanMap[k.id];
    const { data: existing } = await supabase.from('pertemuan').select('id').eq('judul_acara', k.nama_kegiatan || k.judul_acara).eq('tanggal', k.tanggal).maybeSingle();
    if (existing) { setPertemuanMap(prev => ({ ...prev, [k.id]: existing.id })); return existing.id; }
    const { data: baru, error } = await supabase.from('pertemuan').insert([{ judul_acara: k.nama_kegiatan || k.judul_acara, tanggal: k.tanggal, lokasi: k.lokasi || 'RT 03', notulen: k.notulensi || '' }]).select('id').single();
    if (error) { alert('Gagal membuat data pertemuan: ' + error.message); return null; }
    setPertemuanMap(prev => ({ ...prev, [k.id]: baru.id }));
    return baru.id;
  };

  const fetchAbsensi = async (k) => {
    setLoadingAbsensi(true);
    setSearchHadir('');
    setSuggestions([]);
    const pertemuanId = await getOrCreatePertemuan(k);
    if (!pertemuanId) { setLoadingAbsensi(false); return; }
    const { data } = await supabase.from('absensi').select('warga_id, status_hadir').eq('pertemuan_id', pertemuanId);
    const map = {};
    if (data) data.forEach(a => { map[a.warga_id] = a.status_hadir; });
    wargaList.forEach(w => { if (map[w.id] === undefined) map[w.id] = false; });
    setAbsensiData(map);
    setLoadingAbsensi(false);
  };

  const toggleExpand = async (k) => {
    if (expandedId === k.id) { setExpandedId(null); setSearchHadir(''); setSuggestions([]); }
    else { setExpandedId(k.id); await fetchAbsensi(k); }
  };

  const simpanAbsensi = async (k) => {
    setLoadingAbsensi(true);
    const pertemuanId = pertemuanMap[k.id];
    if (!pertemuanId) { alert('Terjadi kesalahan, coba tutup dan buka lagi.'); setLoadingAbsensi(false); return; }
    await supabase.from('absensi').delete().eq('pertemuan_id', pertemuanId);
    const payloads = Object.keys(absensiData).map(wId => ({ pertemuan_id: pertemuanId, warga_id: wId, status_hadir: absensiData[wId] }));
    const { error } = await supabase.from('absensi').insert(payloads);
    const jumlahHadir = Object.values(absensiData).filter(v => v).length;
    await supabase.from('kegiatan_rt').update({ jumlah_hadir: jumlahHadir }).eq('id', k.id);
    if (!error) { alert(`✅ Daftar hadir tersimpan! ${jumlahHadir} warga hadir.`); fetchKegiatan(); }
    else alert('Gagal simpan absensi: ' + error.message);
    setLoadingAbsensi(false);
  };

  // ── SEARCH HADIR ──
  const handleSearchHadir = (val) => {
    setSearchHadir(val);
    if (!val.trim()) { setSuggestions([]); return; }
    const lower = val.toLowerCase();
    const hasil = wargaList.filter(w =>
      w.nama_lengkap.toLowerCase().includes(lower) && !absensiData[w.id]
    ).slice(0, 6);
    setSuggestions(hasil);
  };

  const centangDariSearch = (warga) => {
    setAbsensiData(prev => ({ ...prev, [warga.id]: true }));
    setSearchHadir('');
    setSuggestions([]);
  };

  const bukaEdit = (k) => {
    setEditTarget(k);
    setFormData({ nama_kegiatan: k.nama_kegiatan || k.judul_acara || '', tanggal: k.tanggal || '', notulensi: k.notulensi || '', lokasi: k.lokasi || 'RT 03' });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tutupForm = () => { setShowForm(false); setEditTarget(null); setFormData(emptyForm); };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { nama_kegiatan: formData.nama_kegiatan, judul_acara: formData.nama_kegiatan, notulensi: formData.notulensi, lokasi: formData.lokasi, tanggal: formData.tanggal };
    let error;
    if (editTarget) {
      ({ error } = await supabase.from('kegiatan_rt').update(payload).eq('id', editTarget.id));
    } else {
      ({ error } = await supabase.from('kegiatan_rt').insert([{ ...payload, pj: user.username }]));
    }
    if (!error) { alert(editTarget ? '✅ Kegiatan berhasil diperbarui!' : '✅ Kegiatan berhasil dicatat!'); tutupForm(); fetchKegiatan(); }
    else alert('Gagal menyimpan: ' + error.message);
    setLoading(false);
  };

  const handleHapus = async (k) => {
    if (!window.confirm(`Hapus kegiatan "${k.nama_kegiatan || k.judul_acara}"?`)) return;
    const pertemuanId = pertemuanMap[k.id];
    if (pertemuanId) await supabase.from('absensi').delete().eq('pertemuan_id', pertemuanId);
    const { error } = await supabase.from('kegiatan_rt').delete().eq('id', k.id);
    if (!error) { alert('🗑️ Kegiatan berhasil dihapus.'); fetchKegiatan(); }
    else alert('Gagal menghapus: ' + error.message);
  };

  const getWarna = (persen) => {
    if (persen >= 75) return { bg: '#d5f5e3', color: '#1e8449', label: 'Aktif' };
    if (persen >= 50) return { bg: '#fef9e7', color: '#d68910', label: 'Cukup' };
    return { bg: '#fdf2f2', color: '#c0392b', label: 'Jarang' };
  };

  if (loading && kegiatan.length === 0) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data kegiatan...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* TAB */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[['kegiatan', '📅 Agenda & Notulensi', '#0f766e'], ['rekap', '📊 Rekap Kehadiran', '#7c3aed']].map(([key, label, color]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === key ? color : '#f0f0f0', color: tab === key ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ TAB KEGIATAN ══ */}
      {tab === 'kegiatan' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>📅 Agenda & Notulensi</h3>
            {canInput && !showForm && (
              <button onClick={() => { tutupForm(); setShowForm(true); }}
                style={{ background: '#0f766e', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                + Tambah Kegiatan
              </button>
            )}
          </div>

          {/* FORM */}
          {showForm && canInput && (
            <div style={{ background: 'white', padding: '22px', borderRadius: '14px', marginBottom: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.09)', borderLeft: `5px solid ${editTarget ? '#f59e0b' : '#0f766e'}` }}>
              <h4 style={{ margin: '0 0 16px', color: editTarget ? '#f59e0b' : '#0f766e' }}>
                {editTarget ? '✏️ Edit Kegiatan' : '➕ Tambah Kegiatan Baru'}
              </h4>
              <form onSubmit={handleSave}>
                <div style={fGroup}>
                  <label style={fLabel}>Nama Kegiatan:</label>
                  <input type="text" required style={fInput} value={formData.nama_kegiatan} onChange={e => setFormData({ ...formData, nama_kegiatan: e.target.value })} placeholder="Contoh: Rapat Rutin Bulanan" />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ ...fGroup, flex: 1 }}>
                    <label style={fLabel}>Tanggal:</label>
                    <input type="date" required style={fInput} value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} />
                  </div>
                  <div style={{ ...fGroup, flex: 1 }}>
                    <label style={fLabel}>Lokasi:</label>
                    <input type="text" style={fInput} value={formData.lokasi} onChange={e => setFormData({ ...formData, lokasi: e.target.value })} />
                  </div>
                </div>
                <div style={fGroup}>
                  <label style={fLabel}>Notulensi:</label>
                  <textarea rows="4" style={{ ...fInput, resize: 'vertical' }} value={formData.notulensi} onChange={e => setFormData({ ...formData, notulensi: e.target.value })} placeholder="Tuliskan poin-poin hasil rapat..."></textarea>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={tutupForm} style={{ flex: 1, padding: '11px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Batal</button>
                  <button type="submit" disabled={loading} style={{ flex: 2, padding: '11px', background: editTarget ? '#f59e0b' : '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {loading ? 'Menyimpan...' : editTarget ? 'SIMPAN PERUBAHAN' : 'SIMPAN KEGIATAN'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {kegiatan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#94a3b8' }}>Belum ada kegiatan.</div>
          ) : (
            kegiatan.map(k => (
              <div key={k.id} style={{ background: 'white', padding: '20px', borderRadius: '14px', marginBottom: '14px', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', borderLeft: '5px solid #0f766e' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#1e293b', fontSize: '17px' }}>{k.nama_kegiatan || k.judul_acara}</h4>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '5px', flexWrap: 'wrap' }}>
                      <span style={metaS}>🗓️ {k.tanggal}</span>
                      <span style={metaS}>📍 {k.lokasi || 'RT 03'}</span>
                      <span style={metaS}>👥 {k.jumlah_hadir || 0} Hadir</span>
                      <span style={metaS}>✍️ {k.pj}</span>
                    </div>
                  </div>
                  {canInput && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => bukaEdit(k)} style={btnEdit}>✏️ Edit</button>
                      <button onClick={() => handleHapus(k)} style={btnHapus}>🗑️</button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                  <strong style={{ fontSize: '13px', color: '#475569' }}>Hasil Pertemuan:</strong>
                  <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.7', marginTop: '6px', whiteSpace: 'pre-line' }}>
                    {k.notulensi || 'Tidak ada catatan notulensi.'}
                  </p>
                </div>

                <button onClick={() => toggleExpand(k)}
                  style={{ marginTop: '10px', background: expandedId === k.id ? '#e74c3c' : '#7c3aed', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  {expandedId === k.id ? '✖ Tutup Daftar Hadir' : '📋 Lihat / Isi Daftar Hadir'}
                </button>

                {/* PANEL DAFTAR HADIR */}
                {expandedId === k.id && (
                  <div style={{ marginTop: '14px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <h5 style={{ margin: 0, color: '#1e293b' }}>📋 Daftar Hadir Warga</h5>
                      <span style={{ fontSize: '13px', color: '#0f766e', fontWeight: 'bold' }}>
                        ✅ {Object.values(absensiData).filter(v => v).length} / {wargaList.length} hadir
                      </span>
                    </div>

                    {loadingAbsensi ? (
                      <p style={{ textAlign: 'center', color: '#94a3b8' }}>Memuat absensi...</p>
                    ) : (
                      <>
                        {/* SEARCH BOX */}
                        {canInput && (
                          <div ref={searchRef} style={{ position: 'relative', marginBottom: '14px' }}>
                            <input
                              type="text"
                              value={searchHadir}
                              onChange={e => handleSearchHadir(e.target.value)}
                              placeholder="🔍 Ketik nama warga untuk langsung centang hadir..."
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                            />
                            {suggestions.length > 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, overflow: 'hidden', marginTop: '4px' }}>
                                {suggestions.map(w => (
                                  <div key={w.id}
                                    onClick={() => centangDariSearch(w)}
                                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderBottom: '1px solid #f8fafc' }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f0fdf9'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'white'}
                                  >
                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>{w.nama_lengkap}</span>
                                    <span style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '8px' }}>{w.dawis}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {searchHadir && suggestions.length === 0 && (
                              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
                                {wargaList.find(w => w.nama_lengkap.toLowerCase().includes(searchHadir.toLowerCase()) && absensiData[w.id])
                                  ? '✅ Warga ini sudah tercatat hadir'
                                  : 'Nama tidak ditemukan'}
                              </div>
                            )}
                          </div>
                        )}

                        {/* DAFTAR CHECKBOX */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '7px', marginBottom: '14px' }}>
                          {wargaList.map(w => (
                            <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: absensiData[w.id] ? '#d1fae5' : 'white', borderRadius: '7px', border: `1px solid ${absensiData[w.id] ? '#6ee7b7' : '#e2e8f0'}`, cursor: canInput ? 'pointer' : 'default', fontSize: '13px', transition: 'all 0.15s' }}>
                              <input type="checkbox" checked={!!absensiData[w.id]}
                                onChange={() => canInput && setAbsensiData(prev => ({ ...prev, [w.id]: !prev[w.id] }))}
                                disabled={!canInput} style={{ accentColor: '#0f766e' }} />
                              <span style={{ flex: 1, fontWeight: absensiData[w.id] ? '600' : '400', color: absensiData[w.id] ? '#065f46' : '#334155' }}>{w.nama_lengkap}</span>
                              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{w.dawis?.replace('DAWIS ', 'D')}</span>
                            </label>
                          ))}
                        </div>

                        {canInput && (
                          <button onClick={() => simpanAbsensi(k)} disabled={loadingAbsensi}
                            style={{ background: '#0f766e', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                            {loadingAbsensi ? 'Menyimpan...' : '💾 Simpan Absensi'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ══ TAB REKAP ══ */}
      {tab === 'rekap' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#1e293b' }}>📊 Rekap Kehadiran Warga</h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Total kegiatan: <strong>{rekapData[0]?.total || 0}</strong></span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <span style={{ ...legendBadge, background: '#d1fae5', color: '#065f46' }}>🟢 Aktif ≥ 75%</span>
            <span style={{ ...legendBadge, background: '#fef9c3', color: '#854d0e' }}>🟡 Cukup 50–74%</span>
            <span style={{ ...legendBadge, background: '#fee2e2', color: '#991b1b' }}>🔴 Jarang &lt; 50%</span>
          </div>
          {loadingRekap ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Menghitung rekap...</div>
          ) : rekapData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#94a3b8' }}>Belum ada data absensi.</div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={thS}>#</th>
                    <th style={thS}>Nama Warga</th>
                    <th style={thS}>Dawis</th>
                    <th style={thS}>Hadir</th>
                    <th style={thS}>Keaktifan</th>
                    <th style={thS}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rekapData.map((r, idx) => {
                    const w = getWarna(r.persen);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ ...tdS, color: '#94a3b8', fontSize: '12px' }}>{idx + 1}</td>
                        <td style={{ ...tdS, fontWeight: 'bold' }}>{r.nama}</td>
                        <td style={tdS}><span style={{ background: '#eff6ff', color: '#3b82f6', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{r.dawis}</span></td>
                        <td style={tdS}>{r.hadir} / {r.total} kali</td>
                        <td style={{ ...tdS, minWidth: '120px' }}>
                          <div style={{ background: '#f1f5f9', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${r.persen}%`, background: r.persen >= 75 ? '#10b981' : r.persen >= 50 ? '#f59e0b' : '#ef4444', height: '100%', borderRadius: '10px' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>{r.persen}%</span>
                        </td>
                        <td style={tdS}><span style={{ background: w.bg, color: w.color, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{w.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const fGroup = { marginBottom: '14px' };
const fLabel = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#374151' };
const fInput = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const metaS = { fontSize: '12px', color: '#94a3b8' };
const btnEdit = { background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };
const btnHapus = { background: '#ef4444', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const thS = { padding: '12px 15px', textAlign: 'left', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' };
const tdS = { padding: '12px 15px', fontSize: '14px' };
const legendBadge = { padding: '5px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' };

export default KegiatanRT;
