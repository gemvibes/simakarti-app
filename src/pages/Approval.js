import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Approval = ({ user }) => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRiwayat, setLoadingRiwayat] = useState(false);
  const [filterPengirim, setFilterPengirim] = useState('SEMUA');

  useEffect(() => { fetchPending(); }, []);
  useEffect(() => { if (tab === 'riwayat') fetchRiwayat(); }, [tab]);

  // ── FETCH PENDING ──
  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (data) setPending(groupByBundel(data));
    setLoading(false);
  };

  // ── FETCH RIWAYAT (APPROVED) ──
  const fetchRiwayat = async () => {
    setLoadingRiwayat(true);
    const { data } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false });

    if (data) setRiwayat(groupByBundel(data));
    setLoadingRiwayat(false);
  };

  // ── KELOMPOKKAN PER BUNDEL ──
  const groupByBundel = (data) => {
    const grouped = data.reduce((acc, item) => {
      const key = item.bundel_id || item.id;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          bundel_id: item.bundel_id,
          pj: item.pj || '-',
          total_rt: 0,
          total_kgr: 0,
          total: 0,
          items: [],
          tgl: item.created_at,
          status: item.status
        };
      }
      acc[key].total += Number(item.jumlah);
      if (item.tipe_kas === 'RT') acc[key].total_rt += Number(item.jumlah);
      if (item.tipe_kas === 'KGR') acc[key].total_kgr += Number(item.jumlah);
      acc[key].items.push(item);
      return acc;
    }, {});
    return Object.values(grouped).sort((a, b) => new Date(b.tgl) - new Date(a.tgl));
  };

  // ── APPROVE ──
  const handleApprove = async (bundel) => {
    if (!window.confirm(`Konfirmasi: Terima setoran dari ${bundel.pj.toUpperCase()}?\nTotal: Rp ${bundel.total.toLocaleString('id-ID')}`)) return;
    const ids = bundel.items.map(i => i.id);
    const { error } = await supabase.from('mutasi_kas').update({ status: 'APPROVED' }).in('id', ids);
    if (!error) { alert('✅ Setoran diterima! Saldo kas sudah bertambah.'); fetchPending(); }
    else alert('Gagal: ' + error.message);
  };

  // ── TOLAK (kembalikan ke PENDING dengan catatan) ──
  const handleTolak = async (bundel) => {
    const alasan = window.prompt(`Masukkan alasan penolakan untuk ${bundel.pj.toUpperCase()}:\n(Dawis/Humas akan bisa mengedit dan kirim ulang)`);
    if (alasan === null) return;
    if (!alasan.trim()) { alert('Alasan tidak boleh kosong!'); return; }

    for (const item of bundel.items) {
      await supabase.from('mutasi_kas').update({
        status: 'PENDING',
        keterangan: item.keterangan.replace(/\[DITOLAK:.*?\]/g, '').trim() + ` [DITOLAK: ${alasan}]`
      }).eq('id', item.id);
    }
    alert(`↩️ Setoran dikembalikan ke ${bundel.pj.toUpperCase()}.\nAlasan: ${alasan}`);
    fetchPending();
  };

  // ── BATALKAN APPROVAL (APPROVED → PENDING) ──
  const handleBatalApproval = async (bundel) => {
    if (!window.confirm(`Batalkan approval setoran dari ${bundel.pj.toUpperCase()}?\nSaldo akan berkurang kembali dan Dawis/Humas bisa mengedit ulang.`)) return;
    const ids = bundel.items.map(i => i.id);
    const { error } = await supabase.from('mutasi_kas').update({ status: 'PENDING' }).in('id', ids);
    if (!error) { alert('↩️ Approval dibatalkan. Setoran kembali ke antrian PENDING.'); fetchRiwayat(); fetchPending(); }
    else alert('Gagal: ' + error.message);
  };

  // ── DAFTAR PENGIRIM UNIK untuk filter ──
  const pengirimList = ['SEMUA', ...Array.from(new Set([...pending, ...riwayat].map(b => b.pj.toUpperCase())))];

  const filteredPending = filterPengirim === 'SEMUA' ? pending : pending.filter(b => b.pj.toUpperCase() === filterPengirim);
  const filteredRiwayat = filterPengirim === 'SEMUA' ? riwayat : riwayat.filter(b => b.pj.toUpperCase() === filterPengirim);

  // ── RINGKASAN SALDO ──
  const totalPendingRT = pending.reduce((s, b) => s + b.total_rt, 0);
  const totalPendingKGR = pending.reduce((s, b) => s + b.total_kgr, 0);
  const totalApprovedRT = riwayat.reduce((s, b) => s + b.total_rt, 0);
  const totalApprovedKGR = riwayat.reduce((s, b) => s + b.total_kgr, 0);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat data...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📥 Manajemen Setoran Dawis & Humas</h3>

      {/* ── RINGKASAN KOTAK ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '25px' }}>
        <div style={kotak('#f39c12', '#fff9f0')}>
          <div style={kotakLabel}>⏳ Pending RT</div>
          <div style={kotakVal}>Rp {totalPendingRT.toLocaleString('id-ID')}</div>
          <div style={kotakSub}>{pending.filter(b => b.total_rt > 0).length} setoran menunggu</div>
        </div>
        <div style={kotak('#e74c3c', '#fff5f5')}>
          <div style={kotakLabel}>⏳ Pending KGR</div>
          <div style={kotakVal}>Rp {totalPendingKGR.toLocaleString('id-ID')}</div>
          <div style={kotakSub}>{pending.filter(b => b.total_kgr > 0).length} setoran menunggu</div>
        </div>
        <div style={kotak('#27ae60', '#f0fff4')}>
          <div style={kotakLabel}>✅ Approved RT</div>
          <div style={kotakVal}>Rp {totalApprovedRT.toLocaleString('id-ID')}</div>
          <div style={kotakSub}>{riwayat.filter(b => b.total_rt > 0).length} setoran selesai</div>
        </div>
        <div style={kotak('#2980b9', '#f0f8ff')}>
          <div style={kotakLabel}>✅ Approved KGR</div>
          <div style={kotakVal}>Rp {totalApprovedKGR.toLocaleString('id-ID')}</div>
          <div style={kotakSub}>{riwayat.filter(b => b.total_kgr > 0).length} setoran selesai</div>
        </div>
      </div>

      {/* ── FILTER PENGIRIM ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: 'bold' }}>Filter:</span>
        {pengirimList.map(p => (
          <button key={p} onClick={() => setFilterPengirim(p)}
            style={{ padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', background: filterPengirim === p ? '#2c3e50' : '#f0f0f0', color: filterPengirim === p ? 'white' : '#555' }}>
            {p}
          </button>
        ))}
      </div>

      {/* ── TAB ── */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button onClick={() => setTab('pending')}
          style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === 'pending' ? '#e67e22' : '#f0f0f0', color: tab === 'pending' ? 'white' : '#555', position: 'relative' }}>
          ⏳ Menunggu Approval
          {pending.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#e74c3c', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pending.length}</span>}
        </button>
        <button onClick={() => setTab('riwayat')}
          style={{ padding: '10px 20px', borderRadius: '25px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: tab === 'riwayat' ? '#27ae60' : '#f0f0f0', color: tab === 'riwayat' ? 'white' : '#555' }}>
          ✅ Riwayat Approved
        </button>
      </div>

      {/* ── TAB PENDING ── */}
      {tab === 'pending' && (
        <>
          <div style={{ background: '#fef9e7', border: '1px solid #f1c40f', borderRadius: '10px', padding: '12px 15px', marginBottom: '15px', fontSize: '13px', color: '#7d6608' }}>
            💡 Klik <strong>TERIMA</strong> jika uang fisik sudah diterima. Klik <strong>TOLAK</strong> jika ada kesalahan — pengirim bisa edit ulang.
          </div>

          {filteredPending.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#95a5a6', background: 'white', borderRadius: '12px' }}>
              ☕ Tidak ada setoran yang menunggu.
            </div>
          ) : (
            filteredPending.map(b => (
              <BundelCard key={b.id} bundel={b} onApprove={handleApprove} onTolak={handleTolak} mode="pending" />
            ))
          )}
        </>
      )}

      {/* ── TAB RIWAYAT ── */}
      {tab === 'riwayat' && (
        <>
          {loadingRiwayat ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d' }}>Memuat riwayat...</div>
          ) : filteredRiwayat.length === 0 ? (
            <div style={{ padding: '50px', textAlign: 'center', color: '#95a5a6', background: 'white', borderRadius: '12px' }}>
              Belum ada riwayat setoran yang diapprove.
            </div>
          ) : (
            filteredRiwayat.map(b => (
              <BundelCard key={b.id} bundel={b} onBatalApproval={handleBatalApproval} mode="riwayat" />
            ))
          )}
        </>
      )}
    </div>
  );
};

// ── KOMPONEN KARTU BUNDEL ──
const BundelCard = ({ bundel: b, onApprove, onTolak, onBatalApproval, mode }) => {
  const [expand, setExpand] = useState(false);

  const getPJLabel = (pj) => {
    const map = { ketua: '👑 Ketua', sekretaris: '📝 Sekretaris', bendahara: '💰 Bendahara', humas: '📣 Humas', warga: '👤 Warga' };
    if (map[pj.toLowerCase()]) return map[pj.toLowerCase()];
    if (pj.toLowerCase().startsWith('dawis')) {
      const num = pj.replace('dawis', '');
      const romawi = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
      return `👥 Dawis ${romawi[parseInt(num)] || num}`;
    }
    return pj.toUpperCase();
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', marginBottom: '12px', overflow: 'hidden', boxShadow: '0 3px 10px rgba(0,0,0,0.06)', borderLeft: `5px solid ${mode === 'pending' ? '#f39c12' : '#27ae60'}` }}>
      {/* Header kartu */}
      <div style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#2c3e50' }}>{getPJLabel(b.pj)}</span>
            <span style={{ fontSize: '11px', color: '#7f8c8d', background: '#f8f9fa', padding: '2px 8px', borderRadius: '10px' }}>
              {new Date(b.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '8px', flexWrap: 'wrap' }}>
            {b.total_rt > 0 && <span style={{ fontSize: '13px', color: '#27ae60' }}>RT: <strong>Rp {b.total_rt.toLocaleString('id-ID')}</strong></span>}
            {b.total_kgr > 0 && <span style={{ fontSize: '13px', color: '#2980b9' }}>KGR: <strong>Rp {b.total_kgr.toLocaleString('id-ID')}</strong></span>}
            <span style={{ fontSize: '13px', color: '#2c3e50', fontWeight: 'bold' }}>Total: Rp {b.total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Tombol aksi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {mode === 'pending' && (
            <>
              <button onClick={() => onApprove(b)} style={btnHijau}>✅ TERIMA</button>
              <button onClick={() => onTolak(b)} style={btnMerah}>❌ TOLAK</button>
            </>
          )}
          {mode === 'riwayat' && (
            <button onClick={() => onBatalApproval(b)} style={btnAbu}>↩️ Batalkan</button>
          )}
        </div>
      </div>

      {/* Toggle rincian */}
      <div style={{ borderTop: '1px solid #f1f1f1' }}>
        <button onClick={() => setExpand(!expand)}
          style={{ width: '100%', padding: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#7f8c8d', textAlign: 'center' }}>
          {expand ? '▲ Sembunyikan rincian' : `▼ Lihat ${b.items.length} rincian transaksi`}
        </button>

        {expand && (
          <div style={{ padding: '0 20px 15px' }}>
            {b.items.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f9f9f9', fontSize: '13px' }}>
                <span style={{ color: '#555', flex: 1 }}>{item.keterangan}</span>
                <span style={{ marginLeft: '10px', fontWeight: 'bold', color: item.tipe_kas === 'RT' ? '#27ae60' : '#2980b9', whiteSpace: 'nowrap' }}>
                  [{item.tipe_kas}] Rp {Number(item.jumlah).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── STYLES ──
const kotak = (borderColor, bg) => ({
  background: bg, border: `1px solid ${borderColor}30`, borderRadius: '12px',
  padding: '15px', borderTop: `4px solid ${borderColor}`
});
const kotakLabel = { fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d', textTransform: 'uppercase', marginBottom: '5px' };
const kotakVal = { fontSize: '16px', fontWeight: 'bold', color: '#2c3e50' };
const kotakSub = { fontSize: '11px', color: '#95a5a6', marginTop: '3px' };
const btnHijau = { background: '#27ae60', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' };
const btnMerah = { background: '#e74c3c', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' };
const btnAbu = { background: '#95a5a6', color: 'white', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' };

export default Approval;
