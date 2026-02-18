import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const KegiatanRT = ({ user }) => {
  const [tab, setTab] = useState('kegiatan'); // 'kegiatan' | 'rekap'
  const [kegiatan, setKegiatan] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [absensiData, setAbsensiData] = useState({});
  const [loadingAbsensi, setLoadingAbsensi] = useState(false);
  const [pertemuanMap, setPertemuanMap] = useState({});
  const [rekapData, setRekapData] = useState([]);
  const [loadingRekap, setLoadingRekap] = useState(false);

  const [formData, setFormData] = useState({
    nama_kegiatan: '',
    tanggal: new Date().toISOString().split('T')[0],
    notulensi: '',
    lokasi: 'RT 03'
  });

  const canInput = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => {
    fetchKegiatan();
    fetchWarga();
  }, []);

  useEffect(() => {
    if (tab === 'rekap') fetchRekap();
  }, [tab]);

  const fetchKegiatan = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('kegiatan_rt')
      .select('*')
      .order('tanggal', { ascending: false });
    if (data) setKegiatan(data);
    setLoading(false);
  };

  const fetchWarga = async () => {
    const { data } = await supabase
      .from('warga')
      .select('id, nama_lengkap, dawis')
      .eq('is_active', true)
      .eq('tipe_subjek', 'Warga')
      .order('nama_lengkap', { ascending: true });
    if (data) setWargaList(data);
  };

  const fetchRekap = async () => {
    setLoadingRekap(true);

    // Ambil semua pertemuan
    const { data: pertemuanList } = await supabase
      .from('pertemuan')
      .select('id, judul_acara, tanggal');

    // Ambil semua absensi
    const { data: absensiList } = await supabase
      .from('absensi')
      .select('warga_id, pertemuan_id, status_hadir');

    // Ambil semua warga
    const { data: wargaData } = await supabase
      .from('warga')
      .select('id, nama_lengkap, dawis')
      .eq('is_active', true)
      .eq('tipe_subjek', 'Warga')
      .order('nama_lengkap', { ascending: true });

    if (!pertemuanList || !absensiList || !wargaData) {
      setLoadingRekap(false);
      return;
    }

    const totalKegiatan = pertemuanList.length;

    // Hitung per warga
    const rekap = wargaData.map(w => {
      const hadirCount = absensiList.filter(
        a => a.warga_id === w.id && a.status_hadir === true
      ).length;
      const persen = totalKegiatan > 0 ? Math.round((hadirCount / totalKegiatan) * 100) : 0;
      return {
        id: w.id,
        nama: w.nama_lengkap,
        dawis: w.dawis,
        hadir: hadirCount,
        total: totalKegiatan,
        persen
      };
    });

    // Urutkan dari paling aktif
    rekap.sort((a, b) => b.persen - a.persen);
    setRekapData(rekap);
    setLoadingRekap(false);
  };

  const getOrCreatePertemuan = async (kegiatan) => {
    if (pertemuanMap[kegiatan.id]) return pertemuanMap[kegiatan.id];

    const { data: existing } = await supabase
      .from('pertemuan')
      .select('id')
      .eq('judul_acara', kegiatan.nama_kegiatan || kegiatan.judul_acara)
      .eq('tanggal', kegiatan.tanggal)
      .maybeSingle();

    if (existing) {
      setPertemuanMap(prev => ({ ...prev, [kegiatan.id]: existing.id }));
      return existing.id;
    }

    const { data: baru, error } = await supabase
      .from('pertemuan')
      .insert([{
        judul_acara: kegiatan.nama_kegiatan || kegiatan.judul_acara,
        tanggal: kegiatan.tanggal,
        lokasi: kegiatan.lokasi || 'RT 03',
        notulen: kegiatan.notulensi || ''
      }])
      .select('id')
      .single();

    if (error) { alert('Gagal membuat data pertemuan: ' + error.message); return null; }
    setPertemuanMap(prev => ({ ...prev, [kegiatan.id]: baru.id }));
    return baru.id;
  };

  const fetchAbsensi = async (kegiatan) => {
    setLoadingAbsensi(true);
    const pertemuanId = await getOrCreatePertemuan(kegiatan);
    if (!pertemuanId) { setLoadingAbsensi(false); return; }

    const { data } = await supabase
      .from('absensi')
      .select('warga_id, status_hadir')
      .eq('pertemuan_id', pertemuanId);

    const map = {};
    if (data) data.forEach(a => { map[a.warga_id] = a.status_hadir; });
    wargaList.forEach(w => { if (map[w.id] === undefined) map[w.id] = false; });
    setAbsensiData(map);
    setLoadingAbsensi(false);
  };

  const toggleExpand = async (kegiatan) => {
    if (expandedId === kegiatan.id) {
      setExpandedId(null);
    } else {
      setExpandedId(kegiatan.id);
      await fetchAbsensi(kegiatan);
    }
  };

  const toggleHadir = (wargaId) => {
    setAbsensiData(prev => ({ ...prev, [wargaId]: !prev[wargaId] }));
  };

  const simpanAbsensi = async (kegiatan) => {
    setLoadingAbsensi(true);
    const pertemuanId = pertemuanMap[kegiatan.id];
    if (!pertemuanId) { alert('Terjadi kesalahan, coba tutup dan buka lagi.'); setLoadingAbsensi(false); return; }

    await supabase.from('absensi').delete().eq('pertemuan_id', pertemuanId);

    const payloads = Object.keys(absensiData).map(wargaId => ({
      pertemuan_id: pertemuanId,
      warga_id: wargaId,
      status_hadir: absensiData[wargaId]
    }));

    const { error } = await supabase.from('absensi').insert(payloads);
    const jumlahHadir = Object.values(absensiData).filter(v => v).length;
    await supabase.from('kegiatan_rt').update({ jumlah_hadir: jumlahHadir }).eq('id', kegiatan.id);

    if (!error) {
      alert(`✅ Daftar hadir tersimpan! ${jumlahHadir} warga hadir.`);
      fetchKegiatan();
    } else {
      alert('Gagal simpan absensi: ' + error.message);
    }
    setLoadingAbsensi(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('kegiatan_rt').insert([{
      nama_kegiatan: formData.nama_kegiatan,
      judul_acara: formData.nama_kegiatan,
      notulensi: formData.notulensi,
      lokasi: formData.lokasi,
      tanggal: formData.tanggal,
      pj: user.username
    }]);

    if (!error) {
      alert('✅ Kegiatan berhasil dicatat!');
      setFormData({ nama_kegiatan: '', tanggal: new Date().toISOString().split('T')[0], notulensi: '', lokasi: 'RT 03' });
      setShowForm(false);
      fetchKegiatan();
    } else {
      alert('Gagal menyimpan: ' + error.message);
    }
    setLoading(false);
  };

  const getWarnaAktivitas = (persen) => {
    if (persen >= 75) return { bg: '#d5f5e3', color: '#1e8449', label: 'Aktif' };
    if (persen >= 50) return { bg: '#fef9e7', color: '#d68910', label: 'Cukup' };
    return { bg: '#fdf2f2', color: '#c0392b', label: 'Jarang' };
  };

  if (loading && kegiatan.length === 0) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data kegiatan...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* TAB NAVIGASI */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setTab('kegiatan')}
          style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === 'kegiatan' ? '#3498db' : '#f0f0f0', color: tab === 'kegiatan' ? 'white' : '#555' }}>
          📅 Agenda & Notulensi
        </button>
        <button onClick={() => setTab('rekap')}
          style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === 'rekap' ? '#8e44ad' : '#f0f0f0', color: tab === 'rekap' ? 'white' : '#555' }}>
          📊 Rekap Kehadiran
        </button>
      </div>

      {/* ====== TAB KEGIATAN ====== */}
      {tab === 'kegiatan' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>📅 Agenda & Notulensi Kegiatan</h3>
            {canInput && (
              <button onClick={() => setShowForm(!showForm)}
                style={{ background: showForm ? '#e74c3c' : '#3498db', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                {showForm ? 'Batal' : '+ Tambah Kegiatan'}
              </button>
            )}
          </div>

          {showForm && (
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
              <form onSubmit={handleSave}>
                <div style={formGroup}>
                  <label style={labelS}>Nama Kegiatan:</label>
                  <input type="text" required style={inputS} value={formData.nama_kegiatan}
                    onChange={(e) => setFormData({ ...formData, nama_kegiatan: e.target.value })}
                    placeholder="Contoh: Rapat Rutin Bulanan" />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ ...formGroup, flex: 1 }}>
                    <label style={labelS}>Tanggal:</label>
                    <input type="date" required style={inputS} value={formData.tanggal}
                      onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })} />
                  </div>
                  <div style={{ ...formGroup, flex: 1 }}>
                    <label style={labelS}>Lokasi:</label>
                    <input type="text" style={inputS} value={formData.lokasi}
                      onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })} />
                  </div>
                </div>
                <div style={formGroup}>
                  <label style={labelS}>Notulensi / Hasil Pertemuan:</label>
                  <textarea rows="4" style={{ ...inputS, resize: 'vertical' }} value={formData.notulensi}
                    onChange={(e) => setFormData({ ...formData, notulensi: e.target.value })}
                    placeholder="Tuliskan poin-poin hasil rapat di sini..."></textarea>
                </div>
                <button type="submit" disabled={loading} style={btnSaveS}>
                  {loading ? 'Menyimpan...' : 'SIMPAN KEGIATAN'}
                </button>
              </form>
            </div>
          )}

          {kegiatan.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>
              Belum ada riwayat kegiatan yang tercatat.
            </div>
          ) : (
            kegiatan.map(k => (
              <div key={k.id} style={cardKegiatan}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#2c3e50', fontSize: '18px' }}>{k.nama_kegiatan || k.judul_acara}</h4>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px', flexWrap: 'wrap' }}>
                      <span style={metaS}>🗓️ {k.tanggal}</span>
                      <span style={metaS}>📍 {k.lokasi || 'RT 03'}</span>
                      <span style={metaS}>👥 {k.jumlah_hadir || 0} Hadir</span>
                    </div>
                  </div>
                  <span style={pjBadge}>Oleh: {k.pj}</span>
                </div>

                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <strong style={{ fontSize: '14px', color: '#34495e' }}>Hasil Pertemuan:</strong>
                  <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.6', marginTop: '5px', whiteSpace: 'pre-line' }}>
                    {k.notulensi || 'Tidak ada catatan notulensi.'}
                  </p>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => toggleExpand(k)}
                    style={{ background: expandedId === k.id ? '#e74c3c' : '#8e44ad', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                    {expandedId === k.id ? '✖ Tutup Daftar Hadir' : '📋 Lihat / Isi Daftar Hadir'}
                  </button>
                </div>

                {expandedId === k.id && (
                  <div style={{ marginTop: '15px', background: '#f8f9fa', padding: '15px', borderRadius: '10px' }}>
                    <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>📋 Daftar Hadir Warga</h5>
                    {loadingAbsensi ? (
                      <p style={{ color: '#7f8c8d', textAlign: 'center' }}>Memuat data absensi...</p>
                    ) : (
                      <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginBottom: '15px' }}>
                          {wargaList.map(w => (
                            <label key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: absensiData[w.id] ? '#d5f5e3' : 'white', borderRadius: '6px', border: `1px solid ${absensiData[w.id] ? '#27ae60' : '#ddd'}`, cursor: canInput ? 'pointer' : 'default', fontSize: '13px' }}>
                              <input type="checkbox" checked={!!absensiData[w.id]}
                                onChange={() => canInput && toggleHadir(w.id)}
                                disabled={!canInput} />
                              <span>{w.nama_lengkap}</span>
                              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#95a5a6' }}>{w.dawis}</span>
                            </label>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                          <span style={{ fontSize: '13px', color: '#27ae60', fontWeight: 'bold' }}>
                            ✅ {Object.values(absensiData).filter(v => v).length} dari {wargaList.length} warga hadir
                          </span>
                          {canInput && (
                            <button onClick={() => simpanAbsensi(k)} disabled={loadingAbsensi}
                              style={{ background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                              {loadingAbsensi ? 'Menyimpan...' : '💾 Simpan Absensi'}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}

      {/* ====== TAB REKAP KEHADIRAN ====== */}
      {tab === 'rekap' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>📊 Rekap Kehadiran Warga</h3>
            <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Total kegiatan tercatat: <strong>{rekapData[0]?.total || 0}</strong></span>
          </div>

          {/* Legenda */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <span style={{ ...legendBadge, background: '#d5f5e3', color: '#1e8449' }}>🟢 Aktif ≥ 75%</span>
            <span style={{ ...legendBadge, background: '#fef9e7', color: '#d68910' }}>🟡 Cukup 50–74%</span>
            <span style={{ ...legendBadge, background: '#fdf2f2', color: '#c0392b' }}>🔴 Jarang &lt; 50%</span>
          </div>

          {loadingRekap ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>Menghitung rekap kehadiran...</div>
          ) : rekapData.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>
              Belum ada data absensi yang tercatat.
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
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
                    const warna = getWarnaAktivitas(r.persen);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f1f1', background: idx % 2 === 0 ? 'white' : '#fafafa' }}>
                        <td style={{ ...tdS, color: '#95a5a6', fontSize: '12px' }}>{idx + 1}</td>
                        <td style={{ ...tdS, fontWeight: 'bold' }}>{r.nama}</td>
                        <td style={tdS}>
                          <span style={{ background: '#ebf5ff', color: '#3498db', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{r.dawis}</span>
                        </td>
                        <td style={tdS}>{r.hadir} / {r.total} kali</td>
                        <td style={{ ...tdS, minWidth: '120px' }}>
                          {/* Progress bar */}
                          <div style={{ background: '#eee', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                            <div style={{ width: `${r.persen}%`, background: r.persen >= 75 ? '#27ae60' : r.persen >= 50 ? '#f39c12' : '#e74c3c', height: '100%', borderRadius: '10px', transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: '11px', color: '#555', marginTop: '2px', display: 'block' }}>{r.persen}%</span>
                        </td>
                        <td style={tdS}>
                          <span style={{ background: warna.bg, color: warna.color, padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                            {warna.label}
                          </span>
                        </td>
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

const formGroup = { marginBottom: '15px' };
const labelS = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', color: '#34495e' };
const inputS = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', boxSizing: 'border-box' };
const btnSaveS = { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const cardKegiatan = { background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.03)', borderLeft: '5px solid #3498db' };
const metaS = { fontSize: '12px', color: '#95a5a6' };
const pjBadge = { background: '#f8f9fa', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', color: '#7f8c8d', fontWeight: 'bold' };
const thS = { padding: '12px 15px', textAlign: 'left', fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase' };
const tdS = { padding: '12px 15px', fontSize: '14px' };
const legendBadge = { padding: '5px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' };

export default KegiatanRT;
