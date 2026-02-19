import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = ({ user, setActiveTab }) => {
  const [stats, setStats] = useState({ warga: 0, saldoRT: 0, saldoKGR: 0, pendingRT: 0, pendingKGR: 0 });
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  const isPetinggi = ['bendahara', 'ketua', 'sekretaris'].includes(user.role);

  useEffect(() => { fetchDashboardData(); }, []);

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
            if (m.tipe_kas === 'RT') rt += nominal;
            if (m.tipe_kas === 'KGR') kgr += nominal;
          } else if (m.status === 'PENDING') {
            if (m.tipe_kas === 'RT') pRT += Number(m.jumlah);
            if (m.tipe_kas === 'KGR') pKGR += Number(m.jumlah);
          }
        });
      }
      setStats({ warga: count || 0, saldoRT: rt, saldoKGR: kgr, pendingRT: pRT, pendingKGR: pKGR });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
      Menghitung data...
    </div>
  );

  const cards = [
    {
      key: 'warga',
      icon: '👥',
      label: 'Total Warga',
      value: `${stats.warga} Jiwa`,
      sub: 'Warga aktif RT 03',
      bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      shadow: 'rgba(37,99,235,0.35)',
      tab: 'warga'
    },
    {
      key: 'rt',
      icon: '💰',
      label: 'Kas RT (Riil)',
      value: `Rp ${stats.saldoRT.toLocaleString('id-ID')}`,
      sub: stats.pendingRT > 0 ? `+ Rp ${stats.pendingRT.toLocaleString('id-ID')} pending` : 'Semua sudah diterima',
      bg: 'linear-gradient(135deg, #10b981, #059669)',
      shadow: 'rgba(5,150,105,0.35)',
      tab: 'kas'
    },
    {
      key: 'kgr',
      icon: '⚰️',
      label: 'Kas KGR (Riil)',
      value: `Rp ${stats.saldoKGR.toLocaleString('id-ID')}`,
      sub: stats.pendingKGR > 0 ? `+ Rp ${stats.pendingKGR.toLocaleString('id-ID')} pending` : 'Semua sudah diterima',
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      shadow: 'rgba(217,119,6,0.35)',
      tab: 'kas'
    }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* Sapaan */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '22px' }}>
          Selamat Datang 👋
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
          {user.username.toUpperCase()} — Dashboard RT 03 RW 03
        </p>
      </div>

      {/* Kartu Utama */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {cards.map(c => (
          <div
            key={c.key}
            onClick={() => setActiveTab(c.tab)}
            onMouseEnter={() => setHover(c.key)}
            onMouseLeave={() => setHover(null)}
            style={{
              background: c.bg,
              borderRadius: '16px', color: 'white',
              padding: '22px 24px',
              display: 'flex', alignItems: 'center', gap: '16px',
              boxShadow: hover === c.key
                ? `0 12px 32px ${c.shadow}`
                : `0 4px 16px ${c.shadow}`,
              cursor: 'pointer',
              transform: hover === c.key ? 'translateY(-3px)' : 'translateY(0)',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
          >
            <div style={{
              fontSize: '30px', background: 'rgba(255,255,255,0.2)',
              padding: '12px', borderRadius: '14px',
              minWidth: '56px', textAlign: 'center'
            }}>
              {c.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', opacity: 0.85, letterSpacing: '0.8px' }}>
                {c.label}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '800', margin: '4px 0 2px', lineHeight: 1.2 }}>
                {c.value}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.75 }}>{c.sub}</div>
            </div>
            <div style={{ fontSize: '18px', opacity: hover === c.key ? 1 : 0.4, transition: 'opacity 0.2s' }}>
              →
            </div>
          </div>
        ))}
      </div>

      {/* Pending (hanya petinggi) */}
      {isPetinggi && (stats.pendingRT > 0 || stats.pendingKGR > 0) && (
        <div style={{ background: 'white', borderRadius: '14px', padding: '18px 22px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400e', marginBottom: '12px' }}>
            ⏳ Uang di Lapangan (Menunggu Approval)
          </div>
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

      {/* Info */}
      <div style={{ background: 'white', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)', borderLeft: '4px solid #0f766e' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
          <strong style={{ color: '#0f766e' }}>ℹ️ Catatan:</strong> Saldo Riil adalah dana yang sudah diterima dan dikonfirmasi Bendahara.
          Klik kartu di atas untuk melihat detail data.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
