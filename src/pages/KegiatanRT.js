import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const KegiatanRT = ({ user }) => {
  const [kegiatan, setKegiatan] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Role Check
  const canInput = ['sekretaris', 'ketua'].includes(user.role);

  useEffect(() => {
    fetchKegiatan();
  }, []);

  const fetchKegiatan = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('kegiatan') // Pastikan tabel 'kegiatan' ada di Supabase
      .select('*')
      .order('tanggal', { ascending: false });

    if (!error) setKegiatan(data || []);
    setLoading(false);
  };

  if (loading) return <div style={{ padding: '20px' }}>Memuat data kegiatan...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0 }}>📅 Agenda & Notulensi Kegiatan</h3>
        {canInput && (
          <button style={{ background: '#3498db', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>
            + Tambah Kegiatan
          </button>
        )}
      </div>

      {kegiatan.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', color: '#7f8c8d' }}>
          Belum ada riwayat kegiatan.
        </div>
      ) : (
        kegiatan.map(k => (
          <div key={k.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, color: '#2c3e50' }}>{k.nama_kegiatan}</h4>
              <span style={{ fontSize: '12px', color: '#95a5a6' }}>{k.tanggal}</span>
            </div>
            <p style={{ fontSize: '14px', color: '#555', marginTop: '10px' }}>{k.notulensi || 'Tidak ada notulensi.'}</p>
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee', fontSize: '12px', color: '#3498db' }}>
              📍 Lokasi: {k.lokasi || 'RT 03'}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default KegiatanRT;
