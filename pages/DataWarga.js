import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DataWarga = () => {
  const [warga, setWarga] = useState([]);

  useEffect(() => {
    const fetchWarga = async () => {
      const { data } = await supabase.from('warga').select('*').order('nama_lengkap');
      setWarga(data || []);
    };
    fetchWarga();
  }, []);

  return (
    <div>
      <h3 style={{ borderLeft: '4px solid #2c3e50', paddingLeft: '10px' }}>Data Warga RT 03</h3>
      <p style={{ fontSize: '12px', color: '#7f8c8d' }}>Total: {warga.length} Jiwa</p>
      {warga.map(w => (
        <div key={w.id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontWeight: 'bold' }}>{w.nama_lengkap}</div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Status: {w.status_rumah}</div>
        </div>
      ))}
    </div>
  );
};

export default DataWarga;
