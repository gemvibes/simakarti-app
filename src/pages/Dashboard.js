import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    warga: 0,
    saldoRT: 0,
    saldoKGR: 0,
    agenda: '-'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // 1. Hitung Total Warga
      const { count } = await supabase.from('warga').select('*', { count: 'exact', head: true });
      
      // 2. Hitung Saldo Kas (RT & KGR)
      const { data: mutasi } = await supabase.from('mutasi_kas').select('*');
      
      let rt = 0;
      let kgr = 0;

      if (mutasi) {
        mutasi.forEach(m => {
          if (m.tipe_kas === 'RT') {
            rt += (m.jenis === 'Masuk' ? m.jumlah : -m.jumlah);
          } else if (m.tipe_kas === 'KGR') {
            kgr += (m.jenis === 'Masuk' ? m.jumlah : -m.jumlah);
          }
        });
      }

      // 3. Ambil Jadwal Pertemuan Terakhir
      const { data: pertemuan } = await supabase
        .from('pertemuan')
        .select('judul_acara, tanggal')
        .order('tanggal', { ascending: false })
        .limit(1);

      setStats({
        warga: count || 0,
        saldoRT: rt,
        saldoKGR: kgr,
        agenda: pertemuan && pertemuan.length > 0 
          ? `${pertemuan[0].judul_acara} (${new Date(pertemuan[0].tanggal).toLocaleDateString('id-ID')})` 
          : 'Belum ada agenda'
      });
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Memuat data dashboard...</div>;

  return (
    <div>
      {/* Banner Selamat Datang */}
      <div style={{ background: 'linear-gradient(to right, #2c3e50, #3498db)', padding: '20px', borderRadius: '8px', color: 'white', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Selamat Datang, {user.username}!</h2>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Sistem Informasi Manajemen Administrasi Keuangan & RT (SIMAKARTI)</p>
      </div>

      {/* Grid Kartu Statistik */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        {/* Kartu Warga */}
        <div style={cardStyle}>
          <div style={{ fontSize: '30px' }}>👥</div>
          <div>
            <small style={{ color: '#777' }}>Total Warga</small>
            <h3 style={{ margin: 0 }}>{stats.warga} Jiwa</h3>
          </div>
        </div>

        {/* Kartu Kas RT */}
        <div style={{ ...cardStyle, borderLeft: '5px solid #27ae60' }}>
          <div style={{ fontSize: '30px' }}>💰</div>
          <div>
            <small style={{ color: '#777' }}>Saldo Kas RT</small>
            <h3 style={{ margin: 0, color: '#27ae60' }}>Rp {stats.saldoRT.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        {/* Kartu Kas KGR */}
        <div style={{ ...cardStyle, borderLeft: '5px solid #e67e22' }}>
          <div style={{ fontSize: '30px' }}>⚰️</div>
          <div>
            <small style={{ color: '#777' }}>Saldo KGR</small>
            <h3 style={{ margin: 0, color: '#e67e22' }}>Rp {stats.saldoKGR.toLocaleString('id-ID')}</h3>
          </div>
        </div>

      </div>

      {/* Info Agenda Terkini */}
      <div style={{ marginTop: '30px', background: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #eee' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>📅 Agenda / Pertemuan Terakhir</h4>
        <p style={{ fontSize: '16px', color: '#555', margin: 0 }}>
          {stats.agenda}
        </p>
      </div>
    </div>
  );
};

const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: '15px',
  border: '1px solid #eee'
};

export default Dashboard;
