import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuran = ({ user }) => {
  const [wargaList, setWargaList] = useState([]);
  const [iuranData, setIuranData] = useState({}); // Menyimpan input angka per warga
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const toRomawi = (num) => {
    const romawi = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
    return romawi[num] || num;
  };

  const roleNumber = user.role.replace('dawis', '');
  const dawisLabel = `DAWIS ${toRomawi(roleNumber)}`;

  useEffect(() => {
    fetchWarga();
  }, [user.role]);

  const fetchWarga = async () => {
    setFetching(true);
    const { data, error } = await supabase
      .from('warga')
      .select('id, nama_lengkap')
      .eq('dawis', dawisLabel)
      .order('nama_lengkap', { ascending: true });

    if (!error && data) {
      setWargaList(data);
      // Inisialisasi object input kosong untuk setiap warga
      const initialInput = {};
      data.forEach(w => {
        initialInput[w.id] = { rt: '', kgr: '' };
      });
      setIuranData(initialInput);
    }
    setFetching(false);
  };

  const handleInputChange = (id, field, value) => {
    setIuranData(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSubmitBatch = async () => {
    const payloads = [];
    
    // Scan semua input yang ada isinya
    Object.keys(iuranData).forEach(wargaId => {
      const { rt, kgr } = iuranData[wargaId];
      const namaWarga = wargaList.find(w => w.id === wargaId)?.nama_lengkap;

      if (rt && parseFloat(rt) > 0) {
        payloads.push({
          tipe_kas: 'RT',
          jenis: 'Masuk',
          jumlah: parseFloat(rt),
          keterangan: `Iuran RT - ${namaWarga} (via ${user.username})`,
          warga_id: wargaId,
          pj: user.username
        });
      }
      if (kgr && parseFloat(kgr) > 0) {
        payloads.push({
          tipe_kas: 'KGR',
          jenis: 'Masuk',
          jumlah: parseFloat(kgr),
          keterangan: `Iuran KGR - ${namaWarga} (via ${user.username})`,
          warga_id: wargaId,
          pj: user.username
        });
      }
    });

    if (payloads.length === 0) return alert("Belum ada angka yang diisi!");

    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert(payloads);

    if (!error) {
      alert("✅ Alhamdulillah, semua iuran berhasil disimpan!");
      fetchWarga(); // Reset form
    } else {
      alert("Terjadi kesalahan: " + error.message);
    }
    setLoading(false);
  };

  if (fetching) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Buku Iuran...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
      {/* Header Ala Buku Absen */}
      <div style={{ background: '#27ae60', color: 'white', padding: '20px', textAlign: 'center' }}>
        <h3 style={{ margin: 0 }}>Buku Iuran {dawisLabel}</h3>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px', opacity: 0.9 }}>Masukkan nilai uang pada kolom RT/KGR di samping nama warga</p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
              <th style={thS}>Nama Warga</th>
              <th style={{ ...thS, width: '90px' }}>Iuran RT</th>
              <th style={{ ...thS, width: '90px' }}>KGR</th>
            </tr>
          </thead>
          <tbody>
            {wargaList.map((w) => (
              <tr key={w.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={tdS}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{w.nama_lengkap}</div>
                </td>
                <td style={tdS}>
                  <input 
                    type="number" 
                    placeholder="0"
                    style={inputTableS}
                    value={iuranData[w.id]?.rt || ''}
                    onChange={(e) => handleInputChange(w.id, 'rt', e.target.value)}
                  />
                </td>
                <td style={tdS}>
                  <input 
                    type="number" 
                    placeholder="0"
                    style={inputTableS}
                    value={iuranData[w.id]?.kgr || ''}
                    onChange={(e) => handleInputChange(w.id, 'kgr', e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '20px', background: '#f8f9fa', textAlign: 'center' }}>
        <button 
          onClick={handleSubmitBatch} 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '15px', 
            background: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold', 
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {loading ? '⏳ Sedang Menyimpan...' : '💾 SIMPAN SEMUA IURAN'}
        </button>
        <p style={{ fontSize: '11px', color: '#999', marginTop: '10px' }}>*Pastikan angka sudah benar sebelum menekan tombol simpan</p>
      </div>
    </div>
  );
};

// --- CSS IN JS ---
const thS = { padding: '12px 10px', textAlign: 'left', fontSize: '12px', color: '#7f8c8d', textTransform: 'uppercase' };
const tdS = { padding: '10px' };
const inputTableS = { 
  width: '100%', 
  padding: '8px', 
  borderRadius: '5px', 
  border: '1px solid #ccc', 
  textAlign: 'right',
  fontSize: '14px',
  outline: 'none'
};

export default InputIuran;
