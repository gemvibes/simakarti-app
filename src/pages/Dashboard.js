import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    warga: 0,
    saldoRT: 0,
    saldoKGR: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Total Warga
      const { count } = await supabase.from('warga').select('*', { count: 'exact', head: true });
      
      // 2. Hitung Saldo (Hanya yang APPROVED) & Saldo Pending
      const { data: mutasi } = await supabase.from('mutasi_kas').select('tipe_kas, jenis, jumlah, status');
      
      let rt = 0;
      let kgr = 0;
      let pend = 0;

      if (mutasi) {
        mutasi.forEach(m => {
          const nominal = m.jenis === 'Masuk' ? m.jumlah : -m.jumlah;
          if (m.status === 'APPROVED') {
            if (m.tipe_kas === 'RT') rt += nominal;
            if (m.tipe_kas === 'KGR') kgr += nominal;
          } else if (m.status === 'PENDING') {
            pend += m.jumlah; // Uang di lapangan
          }
        });
      }

      setStats({ warga: count || 0, saldoRT: rt, saldoKGR: kgr, pending: pend });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const isPetinggi = user.role === 'bendahara' || user.role === 'ketua';

  if (loading) return <div style={{ padding: '20px' }}>Menyelaraskan data...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Ringkasan RT 03 RW 03</h2>
        <p style={{ color: '#7f8c8d', margin: '5px 0' }}>Selamat bekerja, <strong>{user.username}</strong></p>
      </header>

      {/* Grid Kartu */}
      <div style={gridStyle}>
        
        {/* Total Jiwa - Biru */}
        <div style={{ ...cardBase, background: '#3498db' }}>
          <div style={iconStyle}>👥</div>
          <div>
            <div style={labelStyle}>Total Jiwa</div>
            <div style={valueStyle}>{stats.warga} <small style={{fontSize:'14px'}}>Warga</small></div>
          </div>
        </div>

        {/* Saldo RT - Hijau */}
        <div style={{ ...cardBase, background: '#27ae60' }}>
          <div style={iconStyle}>💰</div>
          <div>
            <div style={labelStyle}>Saldo Kas RT</div>
            <div style={valueStyle}>Rp {stats.saldoRT.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Saldo KGR - Oranye */}
        <div style={{ ...cardBase, background: '#e67e22' }}>
          <div style={iconStyle}>⚰️</div>
          <div>
            <div style={labelStyle}>Saldo Kas KGR</div>
            <div style={valueStyle}>Rp {stats.saldoKGR.toLocaleString('id-ID')}</div>
          </div>
        </div>

        {/* Uang di Lapangan - Abu-abu (Hanya Bendahara/Ketua) */}
        {isPetinggi && (
          <div style={{ ...cardBase, background: '#7f8c8d' }}>
            <div style={iconStyle}>⏳</div>
            <div>
              <div style={labelStyle}>Uang di Lapangan (Pending)</div>
              <div style={valueStyle}>Rp {stats.pending.toLocaleString('id-ID')}</div>
              <small style={{opacity: 0.8, fontSize: '11px'}}>*Belum disetor Dawis</small>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>💡 Info Sistem</h4>
        <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
          Saldo yang ditampilkan adalah saldo <strong>Riil</strong> (yang sudah diterima Bendahara). 
          Angka "Uang di Lapangan" adalah total iuran yang sudah dicatat Dawis namun fisiknya belum diserahkan ke Bendahara.
        </p>
      </div>
    </div>
  );
};

// --- STYLES ---
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '20px'
};

const cardBase = {
  padding: '25px',
  borderRadius: '16px',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s'
};

const iconStyle = { fontSize: '40px', background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' };
const labelStyle = { fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9, marginBottom: '5px' };
const valueStyle = { fontSize: '22px', fontWeight: 'bold' };

export default Dashboard;
