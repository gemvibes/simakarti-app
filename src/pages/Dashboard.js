import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

const Dashboard = ({ user, setActiveTab }) => {
  const [stats, setStats]     = useState({ warga: 0, saldoRT: 0, saldoKGR: 0, pendingRT: 0, pendingKGR: 0 });
  const [loading, setLoading] = useState(true);
  const [hover, setHover]     = useState(null);

  // Grafik
  const [tahunList, setTahunList]   = useState([]);
  const [tahunDipilih, setTahunDipilih] = useState(new Date().getFullYear());
  const [grafikData, setGrafikData] = useState([]);
  const [loadingGrafik, setLoadingGrafik] = useState(false);

  const isPetinggi = ['bendahara', 'ketua', 'sekretaris'].includes(user.role);

  useEffect(() => { fetchDashboardData(); fetchTahunList(); }, []);
  useEffect(() => { fetchGrafikData(tahunDipilih); }, [tahunDipilih]);

  const fetchDashboardData = async () => {
    try {
      const { count } = await supabase
        .from('warga')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('tipe_subjek', 'Warga');

      const { data: mutasi } = await supabase
        .from('mutasi_kas')
        .select('tipe_kas, jenis, jumlah, status');

      let rt = 0, kgr = 0, pRT = 0, pKGR = 0;
      if (mutasi) {
        mutasi.forEach(m => {
          const nominal = m.jenis === 'Masuk' ? Number(m.jumlah) : -Number(m.jumlah);
          if (m.status === 'APPROVED') {
            if (m.tipe_kas === 'RT')  rt  += nominal;
            if (m.tipe_kas === 'KGR') kgr += nominal;
          } else if (m.status === 'PENDING') {
            if (m.tipe_kas === 'RT')  pRT  += Number(m.jumlah);
            if (m.tipe_kas === 'KGR') pKGR += Number(m.jumlah);
          }
        });
      }
      setStats({ warga: count || 0, saldoRT: rt, saldoKGR: kgr, pendingRT: pRT, pendingKGR: pKGR });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchTahunList = async () => {
    const { data } = await supabase
      .from('mutasi_kas')
      .select('created_at')
      .eq('status', 'APPROVED');
    if (data) {
      const tahunSet = new Set(data.map(d => new Date(d.created_at).getFullYear()));
      const list = Array.from(tahunSet).sort((a, b) => b - a);
      if (!list.includes(new Date().getFullYear())) list.unshift(new Date().getFullYear());
      setTahunList(list);
    }
  };

  const fetchGrafikData = async (tahun) => {
    setLoadingGrafik(true);
    try {
      // Ambil semua transaksi APPROVED
      const { data } = await supabase
        .from('mutasi_kas')
        .select('tipe_kas, jenis, jumlah, created_at')
        .eq('status', 'APPROVED')
        .order('created_at', { ascending: true });

      if (!data) { setGrafikData([]); setLoadingGrafik(false); return; }

      // Hitung saldo kumulatif s/d setiap bulan pada tahun yang dipilih
      // Mulai dari saldo awal (semua transaksi sebelum tahun ini)
      let saldoAwalRT = 0, saldoAwalKGR = 0;
      data.forEach(m => {
        const tgl = new Date(m.created_at);
        if (tgl.getFullYear() < tahun) {
          const nominal = m.jenis === 'Masuk' ? Number(m.jumlah) : -Number(m.jumlah);
          if (m.tipe_kas === 'RT')  saldoAwalRT  += nominal;
          if (m.tipe_kas === 'KGR') saldoAwalKGR += nominal;
        }
      });

      // Hitung delta per bulan pada tahun dipilih
      const deltaRT  = Array(12).fill(0);
      const deltaKGR = Array(12).fill(0);
      data.forEach(m => {
        const tgl = new Date(m.created_at);
        if (tgl.getFullYear() === tahun) {
          const bulanIdx = tgl.getMonth(); // 0-11
          const nominal  = m.jenis === 'Masuk' ? Number(m.jumlah) : -Number(m.jumlah);
          if (m.tipe_kas === 'RT')  deltaRT[bulanIdx]  += nominal;
          if (m.tipe_kas === 'KGR') deltaKGR[bulanIdx] += nominal;
        }
      });

      // Bangun saldo kumulatif per bulan
      const bulanIni   = new Date().getFullYear() === tahun ? new Date().getMonth() : 11;
      const hasil = [];
      let runRT  = saldoAwalRT;
      let runKGR = saldoAwalKGR;

      for (let i = 0; i <= bulanIni; i++) {
        runRT  += deltaRT[i];
        runKGR += deltaKGR[i];
        hasil.push({ bulan: BULAN[i], rt: runRT, kgr: runKGR });
      }

      setGrafikData(hasil);
    } catch (e) { console.error(e); }
    finally { setLoadingGrafik(false); }
  };

  // ── RENDER GRAFIK SVG RESPONSIF ──
  const renderGrafik = () => {
    if (grafikData.length === 0) return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>
        Belum ada data transaksi untuk tahun {tahunDipilih}.
      </div>
    );

    // ViewBox tetap, SVG mengikuti lebar container
    const W = 360, H = 220, padL = 52, padR = 12, padT = 16, padB = 32;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const allVals = grafikData.flatMap(d => [d.rt, d.kgr]);
    const maxVal  = Math.max(...allVals, 1);
    const minVal  = Math.min(...allVals, 0);
    const range   = maxVal - minVal || 1;

    const xStep = innerW / Math.max(grafikData.length - 1, 1);
    const toX   = (i)   => padL + i * xStep;
    const toY   = (val) => padT + innerH - ((val - minVal) / range) * innerH;

    const pathRT  = grafikData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.rt).toFixed(1)}`).join(' ');
    const pathKGR = grafikData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.kgr).toFixed(1)}`).join(' ');

    const areaRT = `M ${toX(0).toFixed(1)} ${toY(grafikData[0].rt).toFixed(1)} ` +
      grafikData.map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.rt).toFixed(1)}`).join(' ') +
      ` L ${toX(grafikData.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

    const areaKGR = `M ${toX(0).toFixed(1)} ${toY(grafikData[0].kgr).toFixed(1)} ` +
      grafikData.map((d, i) => `L ${toX(i).toFixed(1)} ${toY(d.kgr).toFixed(1)}`).join(' ') +
      ` L ${toX(grafikData.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${toX(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

    const yTicks = 4;
    const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
      const val = minVal + (range / yTicks) * i;
      return { val, y: toY(val) };
    });

    const fmtRp = (v) => {
      if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
      if (Math.abs(v) >= 1000)    return `${(v / 1000).toFixed(0)}rb`;
      return `${Math.round(v)}`;
    };

    // Hanya tampilkan label bulan yang tidak terlalu padat
    // Di HP kecil (data 12 bulan) tampilkan selang-seling
    const showLabel = (i) => grafikData.length <= 6 ? true : i % 2 === 0 || i === grafikData.length - 1;

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="gradRT" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="gradKGR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid Y */}
        {yLines.map(({ val, y }, i) => (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={padL - 4} y={y + 3} textAnchor="end" fontSize="8" fill="#94a3b8">{fmtRp(val)}</text>
          </g>
        ))}

        {/* Area */}
        <path d={areaRT}  fill="url(#gradRT)" />
        <path d={areaKGR} fill="url(#gradKGR)" />

        {/* Garis */}
        <path d={pathRT}  fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d={pathKGR} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Titik & label bulan */}
        {grafikData.map((d, i) => (
          <g key={i}>
            {showLabel(i) && (
              <text x={toX(i)} y={H - 4} textAnchor="middle" fontSize="8" fill="#64748b">{d.bulan}</text>
            )}
            <circle cx={toX(i)} cy={toY(d.rt)}  r="3" fill="#10b981" stroke="white" strokeWidth="1.5">
              <title>Kas RT {d.bulan}: Rp {d.rt.toLocaleString('id-ID')}</title>
            </circle>
            <circle cx={toX(i)} cy={toY(d.kgr)} r="3" fill="#f59e0b" stroke="white" strokeWidth="1.5">
              <title>Kas KGR {d.bulan}: Rp {d.kgr.toLocaleString('id-ID')}</title>
            </circle>
          </g>
        ))}

        {/* Border */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + innerH} stroke="#e2e8f0" strokeWidth="0.5" />
        <line x1={padL} y1={padT + innerH} x2={W - padR} y2={padT + innerH} stroke="#e2e8f0" strokeWidth="0.5" />
      </svg>
    );
  };

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
      Menghitung data...
    </div>
  );

  const cards = [
    {
      key: 'warga', icon: '👥', label: 'Total Warga',
      value: `${stats.warga} Jiwa`, sub: 'Warga aktif RT 03',
      bg: 'linear-gradient(135deg, #3b82f6, #2563eb)', shadow: 'rgba(37,99,235,0.35)', tab: 'warga'
    },
    {
      key: 'rt', icon: '💰', label: 'Kas RT (Riil)',
      value: `Rp ${stats.saldoRT.toLocaleString('id-ID')}`,
      sub: stats.pendingRT > 0 ? `+ Rp ${stats.pendingRT.toLocaleString('id-ID')} pending` : 'Semua sudah diterima',
      bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(5,150,105,0.35)', tab: 'kas'
    },
    {
      key: 'kgr', icon: '⚰️', label: 'Kas KGR (Riil)',
      value: `Rp ${stats.saldoKGR.toLocaleString('id-ID')}`,
      sub: stats.pendingKGR > 0 ? `+ Rp ${stats.pendingKGR.toLocaleString('id-ID')} pending` : 'Semua sudah diterima',
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)', shadow: 'rgba(217,119,6,0.35)', tab: 'kas'
    }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Sapaan */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '22px' }}>Selamat Datang 👋</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          {user.username.toUpperCase()} — Dashboard RT 03 RW 03
        </p>
      </div>

      {/* Kartu Utama */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map(c => (
          <div key={c.key}
            onClick={() => setActiveTab(c.tab)}
            onMouseEnter={() => setHover(c.key)}
            onMouseLeave={() => setHover(null)}
            style={{
              background: c.bg, borderRadius: '16px', color: 'white',
              padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '16px',
              boxShadow: hover === c.key ? `0 12px 32px ${c.shadow}` : `0 4px 16px ${c.shadow}`,
              cursor: 'pointer',
              transform: hover === c.key ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.2s ease', userSelect: 'none'
            }}
          >
            <div style={{ fontSize: '30px', background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '14px', minWidth: '56px', textAlign: 'center' }}>
              {c.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.8px' }}>{c.label}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 2px', lineHeight: 1.2 }}>{c.value}</div>
              <div style={{ fontSize: '11px', opacity: 0.75 }}>{c.sub}</div>
            </div>
            <div style={{ fontSize: '18px', opacity: hover === c.key ? 1 : 0.4, transition: 'opacity 0.2s' }}>→</div>
          </div>
        ))}
      </div>

      {/* Pending (hanya petinggi) */}
      {isPetinggi && (stats.pendingRT > 0 || stats.pendingKGR > 0) && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 22px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '12px' }}>⏳ Uang di Lapangan (Menunggu Approval)</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {stats.pendingRT > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Pending RT</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>Rp {stats.pendingRT.toLocaleString('id-ID')}</div>
              </div>
            )}
            {stats.pendingKGR > 0 && (
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Pending KGR</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#f59e0b' }}>Rp {stats.pendingKGR.toLocaleString('id-ID')}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── GRAFIK ── */}
      <div style={{ background: 'white', borderRadius: '16px', padding: '22px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>

        {/* Header grafik */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>📈 Tren Saldo Kas Bulanan</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>Saldo kumulatif akhir setiap bulan (hanya transaksi terverifikasi)</div>
          </div>
          {/* Dropdown tahun */}
          <select value={tahunDipilih} onChange={e => setTahunDipilih(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600', color: '#0f766e', background: '#f0fdfa', outline: 'none', cursor: 'pointer' }}>
            {tahunList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {/* Legenda */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
            <div style={{ width: '24px', height: '3px', background: '#10b981', borderRadius: '2px' }} />
            <span style={{ fontWeight: '600' }}>Kas RT</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569' }}>
            <div style={{ width: '24px', height: '3px', background: '#f59e0b', borderRadius: '2px' }} />
            <span style={{ fontWeight: '600' }}>Kas KGR</span>
          </div>
        </div>

        {/* Grafik */}
        {loadingGrafik ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat grafik...</div>
        ) : renderGrafik()}

        {/* Tabel ringkasan bulan terakhir */}
        {grafikData.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '140px', background: '#f0fdf4', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: '700', textTransform: 'uppercase' }}>Saldo RT — {grafikData[grafikData.length - 1].bulan}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#065f46', marginTop: '4px' }}>
                Rp {grafikData[grafikData.length - 1].rt.toLocaleString('id-ID')}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: '140px', background: '#fffbeb', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '700', textTransform: 'uppercase' }}>Saldo KGR — {grafikData[grafikData.length - 1].bulan}</div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#92400e', marginTop: '4px' }}>
                Rp {grafikData[grafikData.length - 1].kgr.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderLeft: '4px solid #0f766e' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#0f766e' }}>ℹ️ Catatan:</strong> Saldo Riil adalah dana yang sudah diterima dan dikonfirmasi Bendahara. Klik kartu di atas untuk melihat detail data.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
