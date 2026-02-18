import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const MutasiKas = ({ user }) => {
  const [tab, setTab] = useState('neraca');
  const [mutasi, setMutasi] = useState([]);
  const [form, setForm] = useState({ tipe_kas: 'RT', jenis: 'Masuk', jumlah: '', keterangan: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Filter neraca
  const now = new Date();
  const [bulanNeraca, setBulanNeraca] = useState(now.getMonth()); // 0-based
  const [tahunNeraca, setTahunNeraca] = useState(now.getFullYear());

  const isBendahara = ['bendahara', 'ketua'].includes(user.role);

  useEffect(() => { fetchMutasi(); }, []);

  const fetchMutasi = async () => {
    setFetching(true);
    const { data } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });
    if (data) setMutasi(data);
    setFetching(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert([{
      tipe_kas: form.tipe_kas,
      jenis: form.jenis,
      jumlah: parseFloat(form.jumlah),
      keterangan: form.keterangan,
      pj: user.username,
      status: 'APPROVED'
    }]);
    if (!error) {
      setForm({ tipe_kas: 'RT', jenis: 'Masuk', jumlah: '', keterangan: '' });
      fetchMutasi();
      alert('✅ Transaksi berhasil dicatat!');
    } else {
      alert('Gagal: ' + error.message);
    }
    setLoading(false);
  };

  // ── HITUNG SALDO TOTAL ──
  const hitungSaldo = (tipe) =>
    mutasi.filter(m => m.tipe_kas === tipe)
      .reduce((s, m) => m.jenis === 'Masuk' ? s + Number(m.jumlah) : s - Number(m.jumlah), 0);

  // ── KELOMPOKKAN PER BUNDEL untuk tab Riwayat ──
  const getBundels = () => {
    const grouped = mutasi.reduce((acc, item) => {
      const key = item.bundel_id || item.id;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          bundel_id: item.bundel_id,
          pj: item.pj || '-',
          tgl: item.created_at,
          items: [],
          total_masuk: 0,
          total_keluar: 0
        };
      }
      if (item.jenis === 'Masuk') acc[key].total_masuk += Number(item.jumlah);
      else acc[key].total_keluar += Number(item.jumlah);
      acc[key].items.push(item);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  };

  // ── DATA NERACA BULANAN ──
  const getNeracaBulan = () => {
    const filtered = mutasi.filter(m => {
      const d = new Date(m.created_at);
      return d.getMonth() === bulanNeraca && d.getFullYear() === tahunNeraca;
    });

    const masukRT = filtered.filter(m => m.tipe_kas === 'RT' && m.jenis === 'Masuk').reduce((s, m) => s + Number(m.jumlah), 0);
    const keluarRT = filtered.filter(m => m.tipe_kas === 'RT' && m.jenis === 'Keluar').reduce((s, m) => s + Number(m.jumlah), 0);
    const masukKGR = filtered.filter(m => m.tipe_kas === 'KGR' && m.jenis === 'Masuk').reduce((s, m) => s + Number(m.jumlah), 0);
    const keluarKGR = filtered.filter(m => m.tipe_kas === 'KGR' && m.jenis === 'Keluar').reduce((s, m) => s + Number(m.jumlah), 0);

    // Detail transaksi bulan ini
    const detailRT = filtered.filter(m => m.tipe_kas === 'RT').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const detailKGR = filtered.filter(m => m.tipe_kas === 'KGR').sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return { masukRT, keluarRT, masukKGR, keluarKGR, detailRT, detailKGR, total: filtered.length };
  };

  const neraca = getNeracaBulan();
  const bundels = getBundels();
  const tahunList = Array.from(new Set(mutasi.map(m => new Date(m.created_at).getFullYear()))).sort((a, b) => b - a);
  if (!tahunList.includes(now.getFullYear())) tahunList.unshift(now.getFullYear());

  if (fetching) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data kas...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>💰 Laporan Keuangan RT 03</h3>

      {/* ── SALDO TOTAL ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '25px' }}>
        <div style={saldoCard('#27ae60')}>
          <div style={saldoLabel}>💰 Saldo Kas RT</div>
          <div style={saldoVal}>Rp {hitungSaldo('RT').toLocaleString('id-ID')}</div>
          <div style={saldoSub}>Total saldo terkini</div>
        </div>
        <div style={saldoCard('#2980b9')}>
          <div style={saldoLabel}>⚰️ Saldo Kas KGR</div>
          <div style={saldoVal}>Rp {hitungSaldo('KGR').toLocaleString('id-ID')}</div>
          <div style={saldoSub}>Total saldo terkini</div>
        </div>
      </div>

      {/* ── FORM INPUT (Bendahara/Ketua) ── */}
      {isBendahara && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>➕ Tambah Transaksi Langsung</h4>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
              <select style={inpS} value={form.tipe_kas} onChange={e => setForm({ ...form, tipe_kas: e.target.value })}>
                <option value="RT">Kas Umum RT</option>
                <option value="KGR">Kas Kematian (KGR)</option>
              </select>
              <select style={inpS} value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}>
                <option value="Masuk">Uang Masuk</option>
                <option value="Keluar">Uang Keluar</option>
              </select>
            </div>
            <input type="number" placeholder="Jumlah (Rp)" style={{ ...inpS, width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
              value={form.jumlah} onChange={e => setForm({ ...form, jumlah: e.target.value })} required />
            <input type="text" placeholder="Keterangan (Contoh: Beli Sapu, Dana Sosial)" style={{ ...inpS, width: '100%', marginBottom: '10px', boxSizing: 'border-box' }}
              value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} required />
            <button type="submit" disabled={loading} style={{ padding: '12px 25px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </form>
        </div>
      )}

      {/* ── TAB ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['neraca', '📊 Neraca Bulanan', '#8e44ad'], ['riwayat', '📋 Riwayat per Bundel', '#2c3e50']].map(([key, label, color]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === key ? color : '#f0f0f0', color: tab === key ? 'white' : '#555' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB NERACA ══════════════ */}
      {tab === 'neraca' && (
        <>
          {/* Filter bulan & tahun */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={bulanNeraca} onChange={e => setBulanNeraca(Number(e.target.value))} style={inpS}>
              {BULAN.map((b, i) => <option key={i} value={i}>{b}</option>)}
            </select>
            <select value={tahunNeraca} onChange={e => setTahunNeraca(Number(e.target.value))} style={inpS}>
              {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ fontSize: '13px', color: '#7f8c8d' }}>{neraca.total} transaksi ditemukan</span>
          </div>

          {/* Kartu neraca RT & KGR */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            {/* Neraca RT */}
            <div style={neracaCard}>
              <div style={{ background: '#27ae60', color: 'white', padding: '12px 15px', borderRadius: '8px 8px 0 0', fontWeight: 'bold' }}>
                💰 Kas RT — {BULAN[bulanNeraca]} {tahunNeraca}
              </div>
              <div style={{ padding: '15px' }}>
                <div style={neracaRow}>
                  <span style={{ color: '#555' }}>Total Pemasukan</span>
                  <span style={{ color: '#27ae60', fontWeight: 'bold' }}>+ Rp {neraca.masukRT.toLocaleString('id-ID')}</span>
                </div>
                <div style={neracaRow}>
                  <span style={{ color: '#555' }}>Total Pengeluaran</span>
                  <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>- Rp {neraca.keluarRT.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ ...neracaRow, borderTop: '2px solid #eee', paddingTop: '10px', marginTop: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>Selisih Bulan Ini</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: (neraca.masukRT - neraca.keluarRT) >= 0 ? '#27ae60' : '#e74c3c' }}>
                    Rp {(neraca.masukRT - neraca.keluarRT).toLocaleString('id-ID')}
                  </span>
                </div>
                {/* Detail transaksi RT */}
                {neraca.detailRT.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '6px', textTransform: 'uppercase' }}>Rincian Transaksi</div>
                    {neraca.detailRT.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f9f9f9' }}>
                        <span style={{ color: '#555', flex: 1 }}>{new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {m.keterangan}</span>
                        <span style={{ marginLeft: '8px', fontWeight: 'bold', color: m.jenis === 'Masuk' ? '#27ae60' : '#e74c3c', whiteSpace: 'nowrap' }}>
                          {m.jenis === 'Masuk' ? '+' : '-'} Rp {Number(m.jumlah).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {neraca.detailRT.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#bdc3c7', fontSize: '13px', marginTop: '15px' }}>Tidak ada transaksi RT bulan ini</div>
                )}
              </div>
            </div>

            {/* Neraca KGR */}
            <div style={neracaCard}>
              <div style={{ background: '#2980b9', color: 'white', padding: '12px 15px', borderRadius: '8px 8px 0 0', fontWeight: 'bold' }}>
                ⚰️ Kas KGR — {BULAN[bulanNeraca]} {tahunNeraca}
              </div>
              <div style={{ padding: '15px' }}>
                <div style={neracaRow}>
                  <span style={{ color: '#555' }}>Total Pemasukan</span>
                  <span style={{ color: '#27ae60', fontWeight: 'bold' }}>+ Rp {neraca.masukKGR.toLocaleString('id-ID')}</span>
                </div>
                <div style={neracaRow}>
                  <span style={{ color: '#555' }}>Total Pengeluaran</span>
                  <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>- Rp {neraca.keluarKGR.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ ...neracaRow, borderTop: '2px solid #eee', paddingTop: '10px', marginTop: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>Selisih Bulan Ini</span>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: (neraca.masukKGR - neraca.keluarKGR) >= 0 ? '#27ae60' : '#e74c3c' }}>
                    Rp {(neraca.masukKGR - neraca.keluarKGR).toLocaleString('id-ID')}
                  </span>
                </div>
                {neraca.detailKGR.length > 0 && (
                  <div style={{ marginTop: '12px', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '6px', textTransform: 'uppercase' }}>Rincian Transaksi</div>
                    {neraca.detailKGR.map(m => (
                      <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #f9f9f9' }}>
                        <span style={{ color: '#555', flex: 1 }}>{new Date(m.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} — {m.keterangan}</span>
                        <span style={{ marginLeft: '8px', fontWeight: 'bold', color: m.jenis === 'Masuk' ? '#27ae60' : '#e74c3c', whiteSpace: 'nowrap' }}>
                          {m.jenis === 'Masuk' ? '+' : '-'} Rp {Number(m.jumlah).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {neraca.detailKGR.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#bdc3c7', fontSize: '13px', marginTop: '15px' }}>Tidak ada transaksi KGR bulan ini</div>
                )}
              </div>
            </div>
          </div>

          {/* Saldo kumulatif s/d bulan ini */}
          <div style={{ background: '#2c3e50', color: 'white', borderRadius: '12px', padding: '15px 20px', display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase' }}>Saldo RT s/d {BULAN[bulanNeraca]}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Rp {hitungSaldo('RT').toLocaleString('id-ID')}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase' }}>Saldo KGR s/d {BULAN[bulanNeraca]}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Rp {hitungSaldo('KGR').toLocaleString('id-ID')}</div>
            </div>
            <div style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '12px', opacity: 0.6 }}>
              *Saldo total keseluruhan, bukan hanya bulan ini
            </div>
          </div>
        </>
      )}

      {/* ══════════════ TAB RIWAYAT PER BUNDEL ══════════════ */}
      {tab === 'riwayat' && (
        <>
          {bundels.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6', background: 'white', borderRadius: '12px' }}>
              Belum ada riwayat transaksi.
            </div>
          ) : (
            bundels.map(b => <BundelRow key={b.id} bundel={b} />)
          )}
        </>
      )}
    </div>
  );
};

const BundelRow = ({ bundel: b }) => {
  const [expand, setExpand] = useState(false);
  const selisih = b.total_masuk - b.total_keluar;

  const getPJLabel = (pj) => {
    if (!pj) return '-';
    const map = { ketua: '👑 Ketua', sekretaris: '📝 Sekretaris', bendahara: '💰 Bendahara', humas: '📣 Humas', warga: '👤 Warga' };
    if (map[pj.toLowerCase()]) return map[pj.toLowerCase()];
    if (pj.toLowerCase().startsWith('dawis')) {
      const num = pj.replace(/dawis/i, '');
      const romawi = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
      return `👥 Dawis ${romawi[parseInt(num)] || num}`;
    }
    return pj.toUpperCase();
  };

  return (
    <div style={{ background: 'white', borderRadius: '10px', marginBottom: '10px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', borderLeft: `4px solid ${selisih >= 0 ? '#27ae60' : '#e74c3c'}` }}>
      <div style={{ padding: '13px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#2c3e50' }}>{getPJLabel(b.pj)}</span>
            <span style={{ fontSize: '11px', color: '#95a5a6' }}>{new Date(b.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span style={{ fontSize: '11px', background: '#f0f0f0', padding: '2px 7px', borderRadius: '10px', color: '#555' }}>{b.items.length} transaksi</span>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px', flexWrap: 'wrap' }}>
            {b.total_masuk > 0 && <span style={{ fontSize: '13px', color: '#27ae60' }}>▲ Rp {b.total_masuk.toLocaleString('id-ID')}</span>}
            {b.total_keluar > 0 && <span style={{ fontSize: '13px', color: '#e74c3c' }}>▼ Rp {b.total_keluar.toLocaleString('id-ID')}</span>}
          </div>
        </div>
        <button onClick={() => setExpand(!expand)}
          style={{ background: 'none', border: '1px solid #ddd', padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
          {expand ? '▲ Tutup' : '▼ Detail'}
        </button>
      </div>

      {expand && (
        <div style={{ borderTop: '1px solid #f1f1f1', padding: '10px 18px 15px' }}>
          {b.items.map(m => (
            <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '5px 0', borderBottom: '1px solid #f9f9f9' }}>
              <div style={{ flex: 1 }}>
                <span style={{ color: '#333' }}>{m.keterangan}</span>
                <span style={{ marginLeft: '8px', fontSize: '10px', background: m.tipe_kas === 'RT' ? '#e8f5e9' : '#e3f2fd', padding: '1px 5px', borderRadius: '4px', color: m.tipe_kas === 'RT' ? '#27ae60' : '#2980b9' }}>{m.tipe_kas}</span>
              </div>
              <span style={{ fontWeight: 'bold', color: m.jenis === 'Masuk' ? '#27ae60' : '#e74c3c', marginLeft: '10px', whiteSpace: 'nowrap' }}>
                {m.jenis === 'Masuk' ? '+' : '-'} Rp {Number(m.jumlah).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles
const saldoCard = (color) => ({ background: color, color: 'white', borderRadius: '12px', padding: '18px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' });
const saldoLabel = { fontSize: '12px', opacity: 0.85, fontWeight: 'bold', textTransform: 'uppercase' };
const saldoVal = { fontSize: '22px', fontWeight: 'bold', margin: '5px 0' };
const saldoSub = { fontSize: '11px', opacity: 0.7 };
const inpS = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', flex: 1, minWidth: '140px' };
const neracaCard = { background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.07)' };
const neracaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' };

export default MutasiKas;
