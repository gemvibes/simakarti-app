import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputIuranToko = ({ user }) => {
  const [tokoList, setTokoList] = useState([]);
  const [iuranData, setIuranData] = useState({});
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchToko();
  }, []);

  const fetchToko = async () => {
    setFetching(true);
    // Mengambil data subjek yang bertipe 'Toko'
    const { data, error } = await supabase
      .from('warga')
      .select('id, nama_lengkap, nominal_rt_standar')
      .eq('tipe_subjek', 'Toko')
      .eq('is_active', true)
      .order('nama_lengkap', { ascending: true });

    if (!error && data) {
      setTokoList(data);
      const initialInput = {};
      data.forEach(t => {
        // Mengisi otomatis dengan nominal standar dari database
        initialInput[t.id] = t.nominal_rt_standar || '';
      });
      setIuranData(initialInput);
    }
    setFetching(false);
  };

  const handleInputChange = (id, value) => {
    setIuranData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    const payloads = [];
    const bundelId = `TOKO-${tanggal.replace(/-/g, '')}-${Date.now().toString().slice(-3)}`;

    Object.keys(iuranData).forEach(tokoId => {
      const nominal = parseFloat(iuranData[tokoId]);
      const namaToko = tokoList.find(t => t.id === tokoId)?.nama_lengkap;

      if (nominal > 0) {
        payloads.push({
          tipe_kas: 'RT', // Iuran toko selalu masuk Kas RT
          jenis: 'Masuk',
          jumlah: nominal,
          keterangan: `Iuran Toko - ${namaToko}`,
          warga_id: tokoId,
          pj: user.username,
          status: 'PENDING',
          bundel_id: bundelId,
          created_at: tanggal
        });
      }
    });

    if (payloads.length === 0) return alert("Belum ada nominal yang diisi!");

    setLoading(true);
    const { error } = await supabase.from('mutasi_kas').insert(payloads);

    if (!error) {
      alert("✅ Setoran Toko berhasil dikirim! Menunggu persetujuan Bendahara.");
      fetchToko();
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  if (fetching) return <div style={{ padding: '20px', textAlign: 'center' }}>Memuat Daftar Toko...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      <div style={{ background: '#8e44ad', color: 'white', padding: '20px' }}>
        <h3 style={{ margin: 0 }}>🏪 Iuran Toko & Usaha</h3>
        <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '5px' }}>Kelola setoran bulanan unit usaha wilayah RT 03</p>
        <input 
          type="date" 
          value={tanggal} 
          onChange={(e) => setTanggal(e.target.value)} 
          style={{ marginTop: '10px', padding: '8px', borderRadius: '5px', border: 'none', width: '100%' }}
        />
      </div>

      <div style={{ padding: '10px' }}>
        {tokoList.map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #eee' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{t.nama_lengkap}</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', fontSize: '12px', color: '#7f8c8d' }}>Rp</span>
              <input 
                type="number" 
                value={iuranData[t.id]} 
                onChange={(e) => handleInputChange(t.id, e.target.value)}
                style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', textAlign: 'right' }}
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '20px' }}>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          style={{ width: '100%', padding: '15px', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {loading ? 'Menyimpan...' : 'SIMPAN SETORAN TOKO'}
        </button>
      </div>
    </div>
  );
};

export default InputIuranToko;
