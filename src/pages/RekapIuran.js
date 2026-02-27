import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const RekapIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [mutasiData, setMutasiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RT');
  const [tahun, setTahun] = useState(new Date().getFullYear());

  const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];

  // Akses kontrol
  const allowedRoles = ['bendahara', 'ketua', 'sekretaris'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        🚫 Akses ditolak. Halaman ini hanya untuk Bendahara, Ketua, dan Sekretaris.
      </div>
    );
  }

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Ambil semua warga aktif
      const { data: warga } = await supabase
        .from('warga')
        .select('id, nama_lengkap, dawis, tipe_subjek')
        .eq('is_active', true)
        .order('dawis', { ascending: true })
        .order('nama_lengkap', { ascending: true });

      // Ambil semua mutasi APPROVED di tahun yang dipilih
      const startDate = `${tahun}-01-01`;
      const endDate = `${tahun}-12-31`;
      const { data: mutasi } = await supabase
        .from('mutasi_kas')
        .select('warga_id, tipe_kas, jumlah, created_at, status')
        .eq('status', 'APPROVED')
        .eq('jenis', 'Masuk')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      setWargaList(warga || []);
      setMutasiData(mutasi || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Cek apakah warga sudah setor di bulan & tipe tertentu
  const sudahSetor = (wargaId, bulanIndex, tipeKas) => {
    return mutasiData.some(m => {
      const tgl = new Date(m.created_at);
      return (
        m.warga_id === wargaId &&
        m.tipe_kas === tipeKas &&
        tgl.getMonth() === bulanIndex &&
        tgl.getFullYear() === tahun
      );
    });
  };

  // Hitung jumlah yang sudah setor per bulan (untuk baris total)
  const hitungSetor = (bulanIndex, tipeKas) => {
    const daftarWarga = activeTab === 'RT'
      ? wargaList  // Semua warga & toko untuk RT
      : wargaList.filter(w => w.tipe_subjek === 'Warga'); // Hanya warga untuk KGR

    return daftarWarga.filter(w => sudahSetor(w.id, bulanIndex, tipeKas)).length;
  };

  // Filter warga sesuai tab aktif
  const filteredWarga = activeTab === 'RT'
    ? wargaList
    : wargaList.filter(w => w.tipe_subjek === 'Warga');

  // Hitung summary per warga (berapa bulan sudah setor)
  const hitungLunas = (wargaId) => {
    return BULAN.filter((_, i) => sudahSetor(wargaId, i, activeTab)).length;
  };

  const totalWarga = filteredWarga.length;
  const bulanSekarang = new Date().getMonth(); // 0-indexed

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#7f8c8d' }}>
      <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
      Memuat data rekap iuran...
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>📊 Rekap Iuran Warga</h3>
          <p style={{ margin: '4px 0 0 0', color: '#7f8c8d', fontSize: '13px' }}>
            Hanya transaksi berstatus <strong>APPROVED</strong> yang dihitung lunas
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', color: '#555' }}>Tahun:</label>
          <select
            value={tahun}
            onChange={(e) => setTahun(parseInt(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: '14px' }}
          >
            {[2023, 2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB KAS RT / KGR */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['RT', 'KGR'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 25px',
              borderRadius: '25px',
              border: 'none',
              background: activeTab === tab
                ? (tab === 'RT' ? '#27ae60' : '#2980b9')
                : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#555',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab === 'RT' ? '💰 Kas RT' : '⚰️ Kas KGR'}
          </button>
        ))}
      </div>

      {/* SUMMARY CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={summaryCard('#3498db')}>
          <div style={summaryIcon}>👥</div>
          <div>
            <div style={summaryLabel}>Total Warga Wajib</div>
            <div style={summaryValue}>{totalWarga} Orang</div>
          </div>
        </div>
        <div style={summaryCard('#27ae60')}>
          <div style={summaryIcon}>✅</div>
          <div>
            <div style={summaryLabel}>Lunas Bulan Ini</div>
            <div style={summaryValue}>{hitungSetor(bulanSekarang, activeTab)} Orang</div>
          </div>
        </div>
        <div style={summaryCard('#e74c3c')}>
          <div style={summaryIcon}>❌</div>
          <div>
            <div style={summaryLabel}>Belum Setor Bulan Ini</div>
            <div style={summaryValue}>{totalWarga - hitungSetor(bulanSekarang, activeTab)} Orang</div>
          </div>
        </div>
        <div style={summaryCard('#f39c12')}>
          <div style={summaryIcon}>📅</div>
          <div>
            <div style={summaryLabel}>Periode</div>
            <div style={summaryValue}>Tahun {tahun}</div>
          </div>
        </div>
      </div>

      {/* TABEL MATRIKS */}
      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              {/* Baris header bulan */}
              <tr style={{ background: activeTab === 'RT' ? '#27ae60' : '#2980b9', color: 'white' }}>
                <th style={{ ...thS, textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, background: activeTab === 'RT' ? '#219150' : '#1a6fa0', zIndex: 2 }}>
                  Nama Warga
                </th>
                <th style={{ ...thS, minWidth: '80px', background: activeTab === 'RT' ? '#219150' : '#1a6fa0' }}>
                  DAWIS
                </th>
                {BULAN.map((b, i) => (
                  <th key={i} style={{
                    ...thS,
                    minWidth: '55px',
                    background: i === bulanSekarang && tahun === new Date().getFullYear()
                      ? 'rgba(255,255,255,0.25)'
                      : 'transparent'
                  }}>
                    {b}
                    {i === bulanSekarang && tahun === new Date().getFullYear() &&
                      <div style={{ fontSize: '9px', opacity: 0.8 }}>▲</div>
                    }
                  </th>
                ))}
                <th style={{ ...thS, minWidth: '70px' }}>Lunas</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarga.map((w, idx) => {
                const jumlahLunas = hitungLunas(w.id);
                const persentase = Math.round((jumlahLunas / 12) * 100);
                return (
                  <tr key={w.id} style={{
                    borderBottom: '1px solid #f1f1f1',
                    background: idx % 2 === 0 ? 'white' : '#fafafa'
                  }}>
                    <td style={{ ...tdS, fontWeight: 'bold', fontSize: '13px', position: 'sticky', left: 0, background: idx % 2 === 0 ? 'white' : '#fafafa', zIndex: 1 }}>
                      {w.nama_lengkap}
                      {w.tipe_subjek === 'Toko' && (
                        <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fef9e7', color: '#f39c12', padding: '2px 6px', borderRadius: '10px' }}>TOKO</span>
                      )}
                    </td>
                    <td style={{ ...tdS, fontSize: '12px', color: '#3498db', textAlign: 'center' }}>{w.dawis}</td>
                    {BULAN.map((_, i) => {
                      const lunas = sudahSetor(w.id, i, activeTab);
                      const isBulanIni = i === bulanSekarang && tahun === new Date().getFullYear();
                      return (
                        <td key={i} style={{
                          ...tdS,
                          textAlign: 'center',
                          background: isBulanIni
                            ? (lunas ? '#e8f8f0' : '#fef0f0')
                            : 'transparent'
                        }}>
                          {lunas
                            ? <span style={{ color: '#27ae60', fontSize: '16px' }}>✅</span>
                            : <span style={{ color: '#e0e0e0', fontSize: '16px' }}>○</span>
                          }
                        </td>
                      );
                    })}
                    <td style={{ ...tdS, textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: persentase === 100 ? '#e8f8f0' : persentase >= 50 ? '#fff8e1' : '#fef0f0',
                        color: persentase === 100 ? '#27ae60' : persentase >= 50 ? '#f39c12' : '#e74c3c'
                      }}>
                        {jumlahLunas}/12
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* BARIS TOTAL */}
              <tr style={{ background: '#f8f9fa', borderTop: '2px solid #ddd', fontWeight: 'bold' }}>
                <td style={{ ...tdS, fontWeight: 'bold', position: 'sticky', left: 0, background: '#f8f9fa', zIndex: 1, color: '#2c3e50' }}>
                  TOTAL SETOR
                </td>
                <td style={tdS}></td>
                {BULAN.map((_, i) => {
                  const jumlah = hitungSetor(i, activeTab);
                  const persen = totalWarga > 0 ? Math.round((jumlah / totalWarga) * 100) : 0;
                  return (
                    <td key={i} style={{ ...tdS, textAlign: 'center' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: persen === 100 ? '#27ae60' : persen >= 50 ? '#f39c12' : '#e74c3c' }}>
                        {jumlah}
                      </div>
                      <div style={{ fontSize: '10px', color: '#999' }}>{persen}%</div>
                    </td>
                  );
                })}
                <td style={tdS}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LEGENDA */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '12px', color: '#7f8c8d', flexWrap: 'wrap' }}>
        <span>✅ = Sudah setor (APPROVED)</span>
        <span>○ = Belum ada data</span>
        <span style={{ background: 'rgba(52,152,219,0.1)', padding: '2px 8px', borderRadius: '4px' }}>▲ = Bulan berjalan saat ini</span>
      </div>
    </div>
  );
};

// --- STYLES ---
const thS = { padding: '12px 10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' };
const tdS = { padding: '10px', fontSize: '13px' };
const summaryCard = (color) => ({
  background: color,
  color: 'white',
  padding: '15px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
});
const summaryIcon = { fontSize: '24px', background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' };
const summaryLabel = { fontSize: '11px', opacity: 0.85, fontWeight: 'bold', textTransform: 'uppercase' };
const summaryValue = { fontSize: '18px', fontWeight: 'bold', marginTop: '2px' };

export default RekapIuran;
