import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    warga: 0,
    saldoRT: 0,
    saldoKGR: 0,
    pendingRT: 0,
    pendingKGR: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Hitung Warga Aktif
      const { count } = await supabase
        .from('warga')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('tipe_subjek', 'Warga');

      // 2. Ambil Mutasi dengan filter Status
      const { data: mutasi } = await supabase
        .from('mutasi_kas')
        .select('tipe_kas, jenis, jumlah, status');

      let rt = 0, kgr = 0, pRT = 0, pKGR = 0;

      if (mutasi) {
        mutasi.forEach(m => {
          const nominal = m.jenis === 'Masuk' ? m.jumlah : -m.jumlah;
          
          if (m.status === 'APPROVED') {
            if (m.tipe_kas === 'RT') rt += nominal;
            if (m.tipe_kas === 'KGR') kgr += nominal;
          } else if (m.status === 'PENDING') {
            // Pisahkan uang lapangan sesuai tipe kas sesuai permintaan Anda
            if (m.tipe_kas === 'RT') pRT += m.jumlah;
            if (m.tipe_kas === 'KGR') pKGR += m.jumlah;
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

  const isPetinggi = ['bendahara', 'ketua', 'sekretaris'].includes(user.role);

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Menghitung Kas...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '25px' }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Dashboard RT 03</h2>
        <p style={{ color: '#7f8c8d', fontSize: '14px' }}>Data Keuangan Terkini (Transparan & Akurat)</p>
      </header>

      {/* Grid Utama: Saldo Riil */}
      <div style={gridStyle}>
        <div style={{ ...cardBase, background: 'linear-gradient(135deg, #3498db, #2980b9)' }}>
          <div style={iconStyle}>👥</div>
          <div>
            <div style={labelStyle}>Total Warga</div>
            <div style={valueStyle}>{stats.warga} <small style={{fontSize:'12px'}}>Jiwa</small></div>
          </div>
        </div>

        <div style={{ ...cardBase, background: 'linear-gradient(135deg, #27ae60, #219150)' }}>
          <div style={iconStyle}>💰</div>
          <div>
            <div style={labelStyle}>Kas RT (Riil)</div>
            <div style={valueStyle}>Rp {stats.saldoRT.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <div style={{ ...cardBase, background: 'linear-gradient(135deg, #e67e22, #d35400)' }}>
          <div style={iconStyle}>⚰️</div>
          <div>
            <div style={labelStyle}>Kas KGR (Riil)</div>
            <div style={valueStyle}>Rp {stats.saldoKGR.toLocaleString('id-ID')}</div>
          </div>
        </div>
      </div>

      {/* Grid Kedua: Uang di Lapangan (Hanya Petinggi & Bendahara) */}
      {isPetinggi && (
        <>
          <h4 style={{ marginTop: '30px', color: '#7f8c8d', fontSize: '14px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>UANG DI LAPANGAN (PENDING)</h4>
          <div style={{ ...gridStyle, marginTop: '15px' }}>
            <div style={{ ...cardBase, background: '#95a5a6', minHeight: '80px', padding: '15px 20px' }}>
              <div>
                <div style={labelStyle}>Pending RT</div>
                <div style={{...valueStyle, fontSize: '18px'}}>Rp {stats.pendingRT.toLocaleString('id-ID')}</div>
              </div>
            </div>
            <div style={{ ...cardBase, background: '#95a5a6', minHeight: '80px', padding: '15px 20px' }}>
              <div>
                <div style={labelStyle}>Pending KGR</div>
                <div style={{...valueStyle, fontSize: '18px'}}>Rp {stats.pendingKGR.toLocaleString('id-ID')}</div>
              </div>
            </div>
          </div>
        </>
      )}

      <div style={infoBox}>
        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
          <strong>Catatan:</strong> Saldo Riil adalah dana yang sudah diterima Bendahara. 
          Warga dapat memantau transparansi ini kapan saja.
        </p>
      </div>
    </div>
  );
};

// --- STYLES ---
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' };
const cardBase = { padding: '20px', borderRadius: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' };
const iconStyle = { fontSize: '32px', background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px' };
const valueStyle = { fontSize: '20px', fontWeight: 'bold' };
const infoBox = { marginTop: '30px', padding: '15px', background: '#fff', borderRadius: '10px', borderLeft: '4px solid #3498db' };

export default Dashboard;
