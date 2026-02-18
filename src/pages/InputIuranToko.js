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
  const [editBundel, setEditBundel] = useState(null);

  // Form tambah/edit toko
  const emptyToko = { nama_lengkap: '', nominal_rt_standar: '' };
  const [formToko, setFormToko] = useState(emptyToko);
  const [editTokoTarget, setEditTokoTarget] = useState(null);
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
      .order('created_at', { ascending: false });

    if (data) {
      // Filter hanya yang dari toko (bundel_id mulai TOKO- atau keterangan Iuran Toko)
      const filtered = data.filter(m => (m.bundel_id && m.bundel_id.startsWith('TOKO-')) || (m.keterangan && m.keterangan.includes('Iuran Toko')));
      const grouped = filtered.reduce((acc, item) => {
        const key = item.bundel_id || item.id;
        if (!acc[key]) acc[key] = { id: key, bundel_id: item.bundel_id, status: item.status, tgl: item.created_at, items: [], total: 0 };
        acc[key].items.push(item);
        acc[key].total += Number(item.jumlah);
        return acc;
      }, {});
      setRiwayat(Object.values(grouped).sort((a, b) => new Date(b.tgl) - new Date(a.tgl)));
    }
  };

  // ── RESET FORM IURAN ──
  const resetFormIuran = () => {
    setEditBundel(null);
    const init = {};
    tokoList.forEach(t => { init[t.id] = t.nominal_rt_standar ? String(t.nominal_rt_standar) : ''; });
    setIuranData(init);
    setTanggal(new Date().toISOString().split('T')[0]);
  };

  // ── BUKA EDIT SETORAN ──
  const bukaEditBundel = (bundel) => {
    if (bundel.status !== 'PENDING') {
      alert('Setoran yang sudah APPROVED tidak bisa diedit.\nMinta Bendahara untuk membatalkan approval terlebih dahulu.');
      return;
    }
    setEditBundel(bundel);
    const newData = {};
    tokoList.forEach(t => { newData[t.id] = ''; });
    bundel.items.forEach(item => {
      if (item.warga_id && newData[item.warga_id] !== undefined) {
        newData[item.warga_id] = String(item.jumlah);
      }
    });
    setIuranData(newData);
    setTanggal(bundel.tgl ? bundel.tgl.split('T')[0] : new Date().toISOString().split('T')[0]);
    setTab('iuran');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── KIRIM / UPDATE SETORAN ──
  const handleSubmit = async () => {
    const payloads = [];
    const bundelId = editBundel?.bundel_id || `TOKO-${tanggal.replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;

    Object.keys(iuranData).forEach(tokoId => {
      const nominal = parseFloat(iuranData[tokoId]);
      const namaToko = tokoList.find(t => t.id === tokoId)?.nama_lengkap;
      if (nominal > 0) {
        payloads.push({
          tipe_kas: 'RT', jenis: 'Masuk', jumlah: nominal,
          keterangan: `Iuran Toko - ${namaToko}`,
          warga_id: tokoId, pj: user.username,
          status: 'PENDING', bundel_id: bundelId, created_at: tanggal
        });
      }
    });

    if (payloads.length === 0) return alert('Belum ada nominal yang diisi!');
    setLoading(true);

    if (editBundel) {
      // Hapus data lama lalu insert baru
      if (editBundel.bundel_id) {
        await supabase.from('mutasi_kas').delete().eq('bundel_id', editBundel.bundel_id);
      } else {
        await supabase.from('mutasi_kas').delete().in('id', editBundel.items.map(i => i.id));
      }
    }

    const { error } = await supabase.from('mutasi_kas').insert(payloads);
    if (!error) {
      alert(editBundel ? '✅ Setoran berhasil diperbarui!' : '✅ Setoran berhasil dikirim! Menunggu persetujuan Bendahara.');
      resetFormIuran();
      fetchRiwayat();
      setTab('riwayat');
    } else {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // ── TAMBAH / EDIT DATA TOKO ──
  const bukaEditToko = (toko) => {
    setEditTokoTarget(toko);
    setFormToko({ nama_lengkap: toko.nama_lengkap, nominal_rt_standar: toko.nominal_rt_standar ? String(toko.nominal_rt_standar) : '' });
    setTab('tambah');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tutupFormToko = () => {
    setEditTokoTarget(null);
    setFormToko(emptyToko);
  };

  const handleSimpanToko = async (e) => {
    e.preventDefault();
    if (!formToko.nama_lengkap.trim()) { alert('Nama toko wajib diisi!'); return; }
    setSavingToko(true);

    const payload = {
      nama_lengkap: formToko.nama_lengkap.trim().toUpperCase(),
      nominal_rt_standar: parseFloat(formToko.nominal_rt_standar) || 0,
    };

    let error;
    if (editTokoTarget) {
      ({ error } = await supabase.from('warga').update(payload).eq('id', editTokoTarget.id));
    } else {
      ({ error } = await supabase.from('warga').insert([{
        ...payload, dawis: 'TOKO', tipe_subjek: 'Toko',
        status_rumah: 'Tetap', nominal_kgr_standar: 0, is_active: true
      }]));
    }

    if (!error) {
      alert(editTokoTarget ? `✅ Data toko "${payload.nama_lengkap}" berhasil diperbarui!` : `✅ Toko "${payload.nama_lengkap}" berhasil didaftarkan!`);
      tutupFormToko();
      fetchToko();
      setTab('kelola');
    } else {
      alert('Gagal: ' + error.message);
    }
    setSavingToko(false);
  };

  // ── NONAKTIFKAN TOKO ──
  const handleHapusToko = async (id, nama) => {
    if (!window.confirm(`Nonaktifkan toko "${nama}"?\nToko tidak akan muncul di daftar iuran, namun riwayat iuran tetap tersimpan.`)) return;
    const { error } = await supabase.from('warga').update({ is_active: false }).eq('id', id);
    if (!error) { alert('🗑️ Toko berhasil dinonaktifkan.'); fetchToko(); }
    else alert('Gagal: ' + error.message);
  };

  if (fetching) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Daftar Toko...</div>;

  const tabList = [
    ['iuran', '🏪 Input Iuran', '#8e44ad'],
    ['riwayat', '📋 Riwayat', '#2c3e50'],
    ...(isHumas ? [['tambah', editTokoTarget ? '✏️ Edit Toko' : '➕ Tambah Toko', '#27ae60'], ['kelola', '⚙️ Kelola Toko', '#e67e22']] : [])
  ];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      {/* TAB */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
        {tabList.map(([key, label, color]) => (
          <button key={key} onClick={() => { setTab(key); if (key !== 'tambah') tutupFormToko(); }}
            style={{ padding: '9px 16px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', background: tab === key ? color : '#f0f0f0', color: tab === key ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══ TAB INPUT IURAN ══ */}
      {tab === 'iuran' && (
        <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ background: editBundel ? '#e67e22' : '#8e44ad', color: 'white', padding: '20px' }}>
            <h3 style={{ margin: 0 }}>{editBundel ? '✏️ Edit Setoran Toko' : '🏪 Iuran Toko & Usaha'}</h3>
            {editBundel && (
              <div style={{ marginTop: '8px', fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '6px 10px', borderRadius: '6px' }}>
                ⚠️ Mode Edit — data lama akan diganti.
                <button onClick={() => { resetFormIuran(); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px', marginLeft: '8px' }}>Batal Edit</button>
              </div>
            )}
            <p style={{ fontSize: '12px', opacity: 0.9, margin: '8px 0 10px' }}>Kelola setoran bulanan unit usaha RT 03</p>
            <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)}
              style={{ padding: '8px', borderRadius: '5px', border: 'none', width: '100%', maxWidth: '200px' }} />
          </div>

          {tokoList.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>
              Belum ada toko terdaftar.
              {isHumas && <> <button onClick={() => setTab('tambah')} style={{ background: 'none', border: 'none', color: '#8e44ad', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}>Tambah toko baru</button></>}
            </div>
          ) : (
            <>
              <div>
                {tokoList.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 15px', borderBottom: '1px solid #eee' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.nama_lengkap}</div>
                      <div style={{ fontSize: '11px', color: '#95a5a6' }}>Standar: Rp {Number(t.nominal_rt_standar || 0).toLocaleString('id-ID')}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#7f8c8d' }}>Rp</span>
                      <input type="number"
                        value={iuranData[t.id] || ''}
                        onChange={(e) => setIuranData(prev => ({ ...prev, [t.id]: e.target.value }))}
                        style={{ width: '110px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'right' }}
                        placeholder="0" />
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
                  style={{ width: '100%', padding: '14px', background: editBundel ? '#e67e22' : '#8e44ad', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                  {loading ? 'Menyimpan...' : editBundel ? '📤 PERBARUI SETORAN' : '📤 KIRIM SETORAN KE BENDAHARA'}
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: b.status === 'APPROVED' ? '#d5f5e3' : '#fef9e7', color: b.status === 'APPROVED' ? '#27ae60' : '#e67e22' }}>
                      {b.status}
                    </span>
                    {b.status === 'PENDING' && (
                      <button onClick={() => bukaEditBundel(b)}
                        style={{ background: '#e67e22', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                        ✏️ Edit Setoran
                      </button>
                    )}
                    {b.status === 'APPROVED' && (
                      <span style={{ fontSize: '11px', color: '#27ae60' }}>✅ Sudah diterima Bendahara</span>
                    )}
                  </div>
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

      {/* ══ TAB TAMBAH / EDIT TOKO ══ */}
      {tab === 'tambah' && isHumas && (
        <div style={{ background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <div style={{ background: editTokoTarget ? '#f39c12' : '#27ae60', color: 'white', padding: '20px' }}>
            <h3 style={{ margin: 0 }}>{editTokoTarget ? '✏️ Edit Data Toko' : '➕ Daftarkan Toko / Usaha Baru'}</h3>
            <p style={{ fontSize: '12px', opacity: 0.9, margin: '5px 0 0' }}>
              {editTokoTarget ? `Mengubah data: ${editTokoTarget.nama_lengkap}` : 'Toko langsung aktif dan muncul di daftar iuran'}
            </p>
          </div>
          <form onSubmit={handleSimpanToko} style={{ padding: '25px' }}>
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
              <div style={{ fontSize: '11px', color: '#95a5a6', marginTop: '4px' }}>Kosongkan jika nominal berbeda setiap bulan</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              {editTokoTarget && (
                <button type="button" onClick={() => { tutupFormToko(); setTab('kelola'); }}
                  style={{ flex: 1, padding: '13px', background: '#bdc3c7', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Batal
                </button>
              )}
              <button type="submit" disabled={savingToko}
                style={{ flex: 2, padding: '13px', background: editTokoTarget ? '#f39c12' : '#27ae60', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                {savingToko ? 'Menyimpan...' : editTokoTarget ? 'SIMPAN PERUBAHAN' : '✅ DAFTARKAN TOKO'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ TAB KELOLA TOKO ══ */}
      {tab === 'kelola' && isHumas && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ margin: 0, color: '#2c3e50' }}>⚙️ Kelola Daftar Toko</h3>
            <button onClick={() => { tutupFormToko(); setTab('tambah'); }}
              style={{ background: '#27ae60', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
              ➕ Tambah Toko
            </button>
          </div>
          <div style={{ background: '#fff9f0', border: '1px solid #f39c12', borderRadius: '10px', padding: '12px 15px', marginBottom: '15px', fontSize: '13px', color: '#7d6608' }}>
            💡 Edit nama atau nominal iuran toko. Nonaktifkan toko yang sudah tutup — riwayat iuran tetap tersimpan.
          </div>
          {tokoList.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>Belum ada toko terdaftar.</div>
          ) : (
            tokoList.map(t => (
              <div key={t.id} style={{ background: 'white', borderRadius: '10px', padding: '14px 18px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{t.nama_lengkap}</div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Iuran standar: Rp {Number(t.nominal_rt_standar || 0).toLocaleString('id-ID')}/bulan</div>
                </div>
                <div style={{ display: 'flex', gap: '7px' }}>
                  <button onClick={() => bukaEditToko(t)}
                    style={{ background: '#f39c12', color: 'white', border: 'none', padding: '7px 13px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => handleHapusToko(t.id, t.nama_lengkap)}
                    style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '7px 13px', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                    🗑️ Nonaktifkan
                  </button>
                </div>
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
