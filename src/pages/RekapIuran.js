import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const SEMUA_DAWIS = ['DAWIS I', 'DAWIS II', 'DAWIS III', 'DAWIS IV', 'DAWIS V', 'DAWIS VI'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

const RekapIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [mutasiData, setMutasiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('RT');
  const [tahun, setTahun] = useState(new Date().getFullYear());

  // Fitur 1: Filter & Sort Dawis
  const [selectedDawis, setSelectedDawis] = useState([]);
  const [showDawisDropdown, setShowDawisDropdown] = useState(false);

  // Fitur 3: Filter bulan & belum setor
  const [filterBulan, setFilterBulan] = useState(null); // null = semua bulan
  const [filterBelumSetor, setFilterBelumSetor] = useState(false);

  // Fitur 4: Search nama
  const [searchNama, setSearchNama] = useState('');

  const bulanSekarang = new Date().getMonth();

  useEffect(() => {
    fetchData();
  }, [tahun]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: warga } = await supabase
        .from('warga')
        .select('id, nama_lengkap, dawis, tipe_subjek')
        .eq('is_active', true)
        .order('dawis', { ascending: true })
        .order('nama_lengkap', { ascending: true });

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

  // Akses kontrol — setelah semua hooks
  const allowedRoles = ['bendahara', 'ketua', 'sekretaris'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#e74c3c' }}>
        🚫 Akses ditolak. Halaman ini hanya untuk Bendahara, Ketua, dan Sekretaris.
      </div>
    );
  }

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

  // Filter warga sesuai tab, dawis, search, dan filter belum setor
  const getFilteredWarga = () => {
    let list = activeTab === 'RT'
      ? wargaList
      : wargaList.filter(w => w.tipe_subjek === 'Warga');

    // Filter dawis
    if (selectedDawis.length > 0) {
      list = list.filter(w => selectedDawis.includes(w.dawis));
    }

    // Filter search nama
    if (searchNama.trim() !== '') {
      list = list.filter(w =>
        w.nama_lengkap.toLowerCase().includes(searchNama.toLowerCase())
      );
    }

    // Filter belum setor (fitur 3)
    if (filterBelumSetor && filterBulan !== null) {
      list = list.filter(w => !sudahSetor(w.id, filterBulan, activeTab));
    }

    // Sort by dawis
    list = [...list].sort((a, b) => a.dawis.localeCompare(b.dawis) || a.nama_lengkap.localeCompare(b.nama_lengkap));

    return list;
  };

  const filteredWarga = getFilteredWarga();
  const totalWarga = (activeTab === 'RT' ? wargaList : wargaList.filter(w => w.tipe_subjek === 'Warga')).length;

  const hitungSetor = (bulanIndex, tipeKas) => {
    const daftarWarga = activeTab === 'RT'
      ? wargaList
      : wargaList.filter(w => w.tipe_subjek === 'Warga');
    return daftarWarga.filter(w => sudahSetor(w.id, bulanIndex, tipeKas)).length;
  };

  const hitungLunas = (wargaId) => {
    return BULAN.filter((_, i) => sudahSetor(wargaId, i, activeTab)).length;
  };

  const jumlahLunasHariIni = hitungSetor(bulanSekarang, activeTab);
  const jumlahBelumSetor = totalWarga - jumlahLunasHariIni;

  // Toggle dawis selection
  const toggleDawis = (dawis) => {
    setSelectedDawis(prev =>
      prev.includes(dawis) ? prev.filter(d => d !== dawis) : [...prev, dawis]
    );
  };

  // Klik header bulan — fitur 3
  const handleKlikBulan = (i) => {
    if (filterBulan === i) {
      // Klik bulan yang sama = reset
      setFilterBulan(null);
      setFilterBelumSetor(false);
    } else {
      setFilterBulan(i);
    }
  };

  // Klik card belum setor — fitur 3
  const handleKlikBelumSetor = () => {
    if (filterBelumSetor) {
      setFilterBelumSetor(false);
    } else {
      setFilterBelumSetor(true);
      if (filterBulan === null) setFilterBulan(bulanSekarang);
    }
  };

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
            onClick={() => {
              setActiveTab(tab);
              setFilterBelumSetor(false);
              setFilterBulan(null);
              setSearchNama('');
              setSelectedDawis([]);
            }}
            style={{
              padding: '10px 25px', borderRadius: '25px', border: 'none',
              background: activeTab === tab ? (tab === 'RT' ? '#27ae60' : '#2980b9') : '#f0f0f0',
              color: activeTab === tab ? 'white' : '#555',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
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

        <div style={{ ...summaryCard('#27ae60') }}>
          <div style={summaryIcon}>✅</div>
          <div>
            <div style={summaryLabel}>Lunas Bulan Ini</div>
            <div style={summaryValue}>{jumlahLunasHariIni} Orang</div>
          </div>
        </div>

        {/* Card belum setor — bisa diklik (fitur 3) */}
        <div
          onClick={handleKlikBelumSetor}
          style={{
            ...summaryCard(filterBelumSetor ? '#c0392b' : '#e74c3c'),
            cursor: 'pointer',
            border: filterBelumSetor ? '3px solid #fff' : '3px solid transparent',
            boxShadow: filterBelumSetor ? '0 0 0 3px #c0392b' : '0 4px 10px rgba(0,0,0,0.1)',
            transition: 'all 0.2s'
          }}
        >
          <div style={summaryIcon}>❌</div>
          <div>
            <div style={summaryLabel}>Belum Setor {filterBelumSetor ? '(Aktif)' : '— Klik Filter'}</div>
            <div style={summaryValue}>{jumlahBelumSetor} Orang</div>
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

      {/* INFO FILTER AKTIF */}
      {(filterBelumSetor || filterBulan !== null || selectedDawis.length > 0 || searchNama) && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '10px 15px', marginBottom: '15px', fontSize: '13px', color: '#856404', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            🔍 Filter aktif:
            {filterBelumSetor && filterBulan !== null && <strong> Belum setor bulan {BULAN[filterBulan]}</strong>}
            {selectedDawis.length > 0 && <strong> | Dawis: {selectedDawis.join(', ')}</strong>}
            {searchNama && <strong> | Nama: "{searchNama}"</strong>}
          </span>
          <button
            onClick={() => { setFilterBelumSetor(false); setFilterBulan(null); setSelectedDawis([]); setSearchNama(''); }}
            style={{ background: '#856404', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* TOOLBAR: Search + Filter Dawis */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Fitur 4: Search nama */}
        <input
          type="text"
          placeholder="🔍 Cari nama warga..."
          value={searchNama}
          onChange={(e) => setSearchNama(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }}
        />

        {/* Fitur 1: Dropdown multi-select Dawis */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDawisDropdown(!showDawisDropdown)}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              border: selectedDawis.length > 0 ? '2px solid #3498db' : '1px solid #ddd',
              background: selectedDawis.length > 0 ? '#ebf5ff' : 'white',
              color: selectedDawis.length > 0 ? '#2980b9' : '#555',
              fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            🏘️ Filter Dawis {selectedDawis.length > 0 ? `(${selectedDawis.length})` : ''}
            <span style={{ fontSize: '10px' }}>{showDawisDropdown ? '▲' : '▼'}</span>
          </button>

          {showDawisDropdown && (
            <div style={{
              position: 'absolute', top: '110%', left: 0, zIndex: 200,
              background: 'white', borderRadius: '10px', boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              padding: '10px', minWidth: '180px', border: '1px solid #eee'
            }}>
              <div
                onClick={() => setSelectedDawis([])}
                style={{ padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#e74c3c', fontWeight: 'bold', marginBottom: '5px' }}
              >
                ✕ Hapus Filter
              </div>
              {SEMUA_DAWIS.map(d => (
                <div
                  key={d}
                  onClick={() => toggleDawis(d)}
                  style={{
                    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                    fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: selectedDawis.includes(d) ? '#ebf5ff' : 'transparent',
                    color: selectedDawis.includes(d) ? '#2980b9' : '#333',
                    fontWeight: selectedDawis.includes(d) ? 'bold' : 'normal'
                  }}
                >
                  <span style={{
                    width: '16px', height: '16px', borderRadius: '4px', border: '2px solid',
                    borderColor: selectedDawis.includes(d) ? '#3498db' : '#ccc',
                    background: selectedDawis.includes(d) ? '#3498db' : 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', color: 'white', flexShrink: 0
                  }}>
                    {selectedDawis.includes(d) ? '✓' : ''}
                  </span>
                  {d}
                </div>
              ))}
              <div
                onClick={() => setShowDawisDropdown(false)}
                style={{ marginTop: '8px', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', textAlign: 'center', background: '#f8f9fa', color: '#555' }}
              >
                Tutup
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: '13px', color: '#7f8c8d', padding: '10px 0' }}>
          Menampilkan <strong>{filteredWarga.length}</strong> warga
        </div>
      </div>

      {/* TABEL MATRIKS — Fitur 2: max 10 baris scroll, Fitur 5: stripe */}
      <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
          {/* Wrapper scroll vertikal max 10 baris (~520px) */}
          <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 3 }}>
                <tr style={{ background: activeTab === 'RT' ? '#27ae60' : '#2980b9', color: 'white' }}>
                  <th style={{ ...thS, textAlign: 'left', minWidth: '180px', position: 'sticky', left: 0, background: activeTab === 'RT' ? '#219150' : '#1a6fa0', zIndex: 4 }}>
                    Nama Warga
                  </th>
                  <th style={{ ...thS, minWidth: '80px', background: activeTab === 'RT' ? '#219150' : '#1a6fa0' }}>
                    DAWIS
                  </th>
                  {BULAN.map((b, i) => (
                    <th
                      key={i}
                      onClick={() => handleKlikBulan(i)}
                      title={`Klik untuk filter belum setor bulan ${b}`}
                      style={{
                        ...thS,
                        minWidth: '55px',
                        cursor: 'pointer',
                        background: filterBulan === i
                          ? 'rgba(255,255,255,0.4)'
                          : i === bulanSekarang && tahun === new Date().getFullYear()
                          ? 'rgba(255,255,255,0.2)'
                          : 'transparent',
                        borderBottom: filterBulan === i ? '3px solid white' : '3px solid transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      {b}
                      {i === bulanSekarang && tahun === new Date().getFullYear() && filterBulan !== i &&
                        <div style={{ fontSize: '9px', opacity: 0.8 }}>▲</div>
                      }
                      {filterBulan === i &&
                        <div style={{ fontSize: '9px' }}>●</div>
                      }
                    </th>
                  ))}
                  <th style={{ ...thS, minWidth: '70px' }}>Lunas</th>
                </tr>
              </thead>
              <tbody>
                {filteredWarga.length === 0 ? (
                  <tr>
                    <td colSpan={15} style={{ padding: '30px', textAlign: 'center', color: '#95a5a6', fontSize: '14px' }}>
                      Tidak ada data yang sesuai filter
                    </td>
                  </tr>
                ) : (
                  filteredWarga.map((w, idx) => {
                    const jumlahLunas = hitungLunas(w.id);
                    const persentase = Math.round((jumlahLunas / 12) * 100);
                    // Fitur 5: stripe putih abu-abu
                    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f4f6f8';
                    return (
                      <tr key={w.id} style={{ borderBottom: '1px solid #eee', background: rowBg }}>
                        <td style={{ ...tdS, fontWeight: 'bold', fontSize: '13px', position: 'sticky', left: 0, background: rowBg, zIndex: 1 }}>
                          {w.nama_lengkap}
                          {w.tipe_subjek === 'Toko' && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fef9e7', color: '#f39c12', padding: '2px 6px', borderRadius: '10px' }}>TOKO</span>
                          )}
                        </td>
                        <td style={{ ...tdS, fontSize: '12px', color: '#3498db', textAlign: 'center', fontWeight: 'bold' }}>{w.dawis}</td>
                        {BULAN.map((_, i) => {
                          const lunas = sudahSetor(w.id, i, activeTab);
                          const isBulanDipilih = filterBulan === i;
                          return (
                            <td key={i} style={{
                              ...tdS,
                              textAlign: 'center',
                              background: isBulanDipilih
                                ? (lunas ? '#d5f5e3' : '#fde8e8')
                                : 'transparent'
                            }}>
                              {lunas
                                ? <span style={{ color: '#27ae60', fontSize: '16px' }}>✅</span>
                                : <span style={{ color: '#ddd', fontSize: '16px' }}>○</span>
                              }
                            </td>
                          );
                        })}
                        <td style={{ ...tdS, textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
                            fontSize: '12px', fontWeight: 'bold',
                            background: persentase === 100 ? '#e8f8f0' : persentase >= 50 ? '#fff8e1' : '#fef0f0',
                            color: persentase === 100 ? '#27ae60' : persentase >= 50 ? '#f39c12' : '#e74c3c'
                          }}>
                            {jumlahLunas}/12
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* BARIS TOTAL */}
                <tr style={{ background: '#ecf0f1', borderTop: '2px solid #bdc3c7', fontWeight: 'bold', position: 'sticky', bottom: 0 }}>
                  <td style={{ ...tdS, fontWeight: 'bold', position: 'sticky', left: 0, background: '#ecf0f1', zIndex: 1, color: '#2c3e50' }}>
                    TOTAL SETOR
                  </td>
                  <td style={tdS}></td>
                  {BULAN.map((_, i) => {
                    const jumlah = hitungSetor(i, activeTab);
                    const persen = totalWarga > 0 ? Math.round((jumlah / totalWarga) * 100) : 0;
                    return (
                      <td key={i} style={{ ...tdS, textAlign: 'center', background: filterBulan === i ? '#dfe6e9' : 'transparent' }}>
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
      </div>

      {/* LEGENDA */}
      <div style={{ marginTop: '15px', display: 'flex', gap: '20px', fontSize: '12px', color: '#7f8c8d', flexWrap: 'wrap' }}>
        <span>✅ = Sudah setor (APPROVED)</span>
        <span>○ = Belum ada data</span>
        <span>▲ = Bulan berjalan</span>
        <span>● = Bulan dipilih untuk filter</span>
        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Klik header bulan → filter belum setor | Klik card merah → aktifkan filter</span>
      </div>
    </div>
  );
};

// --- STYLES ---
const thS = { padding: '12px 10px', fontSize: '12px', fontWeight: 'bold', textAlign: 'center' };
const tdS = { padding: '10px', fontSize: '13px' };
const summaryCard = (color) => ({
  background: color, color: 'white', padding: '15px', borderRadius: '12px',
  display: 'flex', alignItems: 'center', gap: '12px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
});
const summaryIcon = { fontSize: '24px', background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '10px' };
const summaryLabel = { fontSize: '11px', opacity: 0.85, fontWeight: 'bold', textTransform: 'uppercase' };
const summaryValue = { fontSize: '18px', fontWeight: 'bold', marginTop: '2px' };

export default RekapIuran;
