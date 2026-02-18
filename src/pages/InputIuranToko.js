import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuranToko = ({ user }) => {
  const [tab, setTab] = useState('iuran');
  const [tokoList, setTokoList] = useState([]);
  const [iuranData, setIuranData] = useState({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [riwayat, setRiwayat] = useState([]);

  // Form tambah toko baru
  const emptyToko = { nama_lengkap: '', nominal_rt_standar: '' };
  const [formToko, setFormToko] = useState(emptyToko);
  const [savingToko, setSavingToko] = useState(false);

  const isHumas = user.role === 'humas';

  useEffect(() => { fetchToko(); fetchRiwayat(); }, []);

  const fetchToko = async () => {
    setFetching(true);
    const { data } = await supabase
      .from('warga')
      .select('id, nama_lengkap, nominal_rt_standar')
      .eq('tipe_subjek', 'Toko')
      .eq('is_active', true)
      .order('nama_lengkap', { ascending: true });

    if (data) {
      setTokoList(data);
      const init = {};
      data.forEach(t => { init[t.id] = t.nominal_rt_standar ? String(t.nominal_rt_standar) : ''; });
      setIuranData(init);
    }
    setFetching(false);
  };

  const fetchRiwayat = async () => {
    const { data } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('pj', user.username)
      .ilike('bundel_id', 'TOKO-%')
      .order('created_at', { ascending: false });

    if (data) {
      const grouped = data.reduce((acc, item) => {
        const key = item.bundel_id || item.id;
        if (!acc[key]) acc[key] = { id: key, bundel_id: item.bundel_id, status: item.status, tgl: item.created_at, items: [], total: 0 };
        acc[key].items.push(item);
        acc[key].total += Number(item.jumlah);
        return acc;
      }, {});
      setRiwayat(Object.values(grouped).sort((a, b) => new Date(b.tgl) - new Date(a.tgl)));
    }
  };

  // ── TAMBAH TOKO BARU ──
  const handleTambahToko = async (e) => {
    e.preventDefault();
    if (!formToko.nama_lengkap.trim()) { alert('Nama toko wajib diisi!'); return; }
    setSavingToko(true);

    const { error } = await supabase.from('warga').insert([{
      nama_lengkap: formToko.nama_lengkap.trim().toUpperCase(),
      dawis: 'TOKO',
      tipe_subjek: 'Toko',
      status_rumah: 'Tetap',
      nominal_rt_standar: parseFloat(formToko.nominal_rt_standar) || 0,
      nominal_kgr_standar: 0,
      is_active: true
    }]);

    if (!error) {
      alert(`✅ Toko "${formToko.nama_lengkap.toUpperCase()}" berhasil ditambahkan dan langsung aktif!`);
      setFormToko(emptyToko);
      setTab('iuran');
      fetchToko();
    } else {
      alert('Gagal menambah toko: ' + error.message);
    }
    setSavingToko(false);
  };

  // ── NONAKTIFKAN TOKO ──
  const handleHapusToko = async (id, nama) => {
    if (!window.confirm(`Nonaktifkan toko "${nama}"? Toko tidak akan muncul di daftar iuran.`)) return;
    const { error } = await supabase.from('warga').update({ is_active: false }).eq('id', id);
    if (!error) { alert('🗑️ Toko berhasil dinonaktifkan.'); fetchToko(); }
    else alert('Gagal: ' + error.message);
  };

  // ── KIRIM SETORAN TOKO ──
  const handleSubmit = async () => {
    const payloads = [];
    const bundelId = `TOKO-${tanggal.replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;

    Object.keys(iuranData).forEach(tokoId => {
      const nominal = parseFloat(iuranData[tokoId]);
      const namaToko = tokoList.find(t => t.id === tokoId)?.nama_lengkap;
      if (nominal > 0) {
        payloads.push({
          tipe_kas: 'RT',
          jenis: 'Masuk',
          jumlah: nominal,
          keterangan: `Iuran Toko - ${namaToko}`,
          warga_id: tokoId,
          pj: user.username,
          status: 'PENDING',
          bundel_id: bundelId,
          created_at: tanggal
        });
      }
    });

    if (payloads.length === 0) return alert('Belum ada nominal yang diisi!');
    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert(payloads);
    if (!error) {
      alert('✅ Setoran Toko berhasil dikirim! Menunggu persetujuan Bendahara.');
      fetchToko();
      fetchRiwayat();
      setTab('riwayat');
    } else {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  if (fetching) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Daftar Toko...</div>;

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* TAB */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {[
          ['iuran', '🏪 Input Iuran Toko', '#8e44ad'],
          ['riwayat', '📋 Riwayat Setoran', '#2c3e50'],
          ...(isHumas ? [['tambah', '➕ Tambah Toko Baru', '#27ae60'], ['kelola', '⚙️ Kelola Toko', '#e67e22']] : [])
        ].map(([key, label, color]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '9px 16px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', background: tab === key ? color : '#f0f0f0', color: tab === key ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ TAB INPUT IURAN ══ */}
      {tab === 'iuran' && (
        <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ background: '#8e44ad', color: 'white', padding: '20px' }}>
            <h3 style={{ margin: 0 }}>🏪 Iuran Toko & Usaha</h3>
            <p style={{ fontSize: '12px', opacity: 0.9, margin: '5px 0 10px' }}>Kelola setoran bulanan unit usaha RT 03</p>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              style={{ padding: '8px', borderRadius: '5px', border: 'none', width: '100%', maxWidth: '200px' }} />
          </div>

          {tokoList.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
              Belum ada toko terdaftar.{isHumas && <span> <button onClick={() => setTab('tambah')} style={{ background: 'none', border: 'none', color: '#8e44ad', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Tambah toko baru</button></span>}
            </div>
          ) : (
            <>
              <div style={{ padding: '5px' }}>
                {tokoList.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 15px', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.nama_lengkap}</div>
                      <div style={{ fontSize: '11px', color: '#95a5a6' }}>Standar: Rp {Number(t.nominal_rt_standar || 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#7f8c8d' }}>Rp</span>
                      <input type="number" value={iuranData[t.id] || ''} onChange={(e) => setIuranData(prev => ({ ...prev, [t.id]: e.target.value }))}
                        style={{ width: '110px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'right' }} placeholder="0" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ padding: '10px 20px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#7f8c8d' }}>Total Setoran</span>
                <span style={{ fontWeight: 'bold', color: '#8e44ad' }}>
                  Rp {Object.values(iuranData).reduce((s, v) => s + (parseFloat(v) || 0), 0).toLocaleString('id-ID')}
                </span>
              </div>

              <div style={{ padding: '15px 20px' }}>
                <button onClick={handleSubmit} disabled={loading}
                  style={{ width: '100%', padding: '14px', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  {loading ? 'Menyimpan...' : '📤 KIRIM SETORAN KE BENDAHARA'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ TAB RIWAYAT ══ */}
      {tab === 'riwayat' && (
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📋 Riwayat Setoran Toko</h3>
          {riwayat.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>Belum ada riwayat setoran toko.</div>
          ) : (
            riwayat.map(b => (
              <div key={b.id} style={{ background: 'white', borderRadius: '12px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `5px solid ${b.status === 'APPROVED' ? '#27ae60' : '#f39c12'}` }}>
                <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{new Date(b.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>Rp {b.total.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{b.items.length} toko</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: b.status === 'APPROVED' ? '#d5f5e3' : '#fef9e7', color: b.status === 'APPROVED' ? '#27ae60' : '#e67e22' }}>
                    {b.status}
                  </span>
                </div>
                <div style={{ padding: '0 18px 12px', borderTop: '1px solid #f5f5f5' }}>
                  {b.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', color: '#555' }}>
                      <span>{item.keterangan}</span>
                      <span style={{ fontWeight: 'bold', color: '#8e44ad' }}>Rp {Number(item.jumlah).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ══ TAB TAMBAH TOKO (hanya humas) ══ */}
      {tab === 'tambah' && isHumas && (
        <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ background: '#27ae60', color: 'white', padding: '20px' }}>
            <h3 style={{ margin: 0 }}>➕ Daftarkan Toko / Usaha Baru</h3>
            <p style={{ fontSize: '12px', opacity: 0.9, margin: '5px 0 0' }}>Toko yang didaftarkan langsung aktif dan muncul di daftar iuran</p>
          </div>
          <form onSubmit={handleTambahToko} style={{ padding: '25px' }}>
            <div style={fGroup}>
              <label style={fLabel}>Nama Toko / Usaha *</label>
              <input type="text" required style={fInput} value={formToko.nama_lengkap}
                onChange={e => setFormToko({ ...formToko, nama_lengkap: e.target.value })}
                placeholder="Contoh: WARUNG BU SARI" />
              <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '4px' }}>Nama akan otomatis ditulis kapital</div>
            </div>
            <div style={fGroup}>
              <label style={fLabel}>Iuran RT Standar per Bulan (Rp)</label>
              <input type="number" style={fInput} value={formToko.nominal_rt_standar}
                onChange={e => setFormToko({ ...formToko, nominal_rt_standar: e.target.value })}
                placeholder="Contoh: 25000" />
              <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '4px' }}>Kosongkan jika nominal iuran berbeda setiap bulan</div>
            </div>
            <button type="submit" disabled={savingToko}
              style={{ width: '100%', padding: '14px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              {savingToko ? 'Menyimpan...' : '✅ DAFTARKAN TOKO'}
            </button>
          </form>
        </div>
      )}

      {/* ══ TAB KELOLA TOKO (hanya humas) ══ */}
      {tab === 'kelola' && isHumas && (
        <div>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>⚙️ Kelola Daftar Toko</h3>
          <div style={{ background: '#fff9f0', border: '1px solid #f39c12', borderRadius: '10px', padding: '12px 15px', marginBottom: '15px', fontSize: '13px', color: '#7d6608' }}>
            💡 Anda dapat menonaktifkan toko yang sudah tutup. Data iuran lama tetap tersimpan.
          </div>
          {tokoList.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>Belum ada toko terdaftar.</div>
          ) : (
            tokoList.map(t => (
              <div key={t.id} style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{t.nama_lengkap}</div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Iuran standar: Rp {Number(t.nominal_rt_standar || 0).toLocaleString('id-ID')}/bulan</div>
                </div>
                <button onClick={() => handleHapusToko(t.id, t.nama_lengkap)}
                  style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '7px 13px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                  🗑️ Nonaktifkan
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const fGroup = { marginBottom: '18px' };
const fLabel = { display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px', color: '#34495e' };
const fInput = { width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

export default InputIuranToko;
