import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [data, setData] = useState({ rt: 0, kgr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKas = async () => {
      try {
        const { data: kas, error } = await supabase.from('transaksi_kas').select('*');
        if (error) throw error;

        let rt = 0; let kgr = 0;
        kas?.forEach(t => {
          const nom = Number(t.nominal) || 0;
          // Cek apakah kolomnya bernama 'jenis' atau 'jenis_transaksi'
          const tipe = t.jenis_transaksi || t.jenis; 
          
          if (t.kategori_kas === 'KGR') {
            tipe === 'Pemasukan' ? kgr += nom : kgr -= nom;
          } else {
            tipe === 'Pemasukan' ? rt += nom : rt -= nom;
          }
        });
        setData({ rt, kgr });
      } catch (err) {
        console.error("Error Database:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchKas();
  }, []);

  return (
    <div>
      <h3 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Dashboard Kas</h3>
      {loading ? <p>Menghitung Saldo...</p> : (
        <>
          <div style={{ background: '#2980b9', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '15px' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>Total Kas Umum RT 03</p>
            <h2 style={{ margin: 0 }}>Rp {data.rt.toLocaleString('id-ID')}</h2>
          </div>
          <div style={{ background: '#27ae60', color: 'white', padding: '20px', borderRadius: '15px' }}>
            <p style={{ margin: 0, fontSize: '12px' }}>Total Kas KGR (Kematian)</p>
            <h2 style={{ margin: 0 }}>Rp {data.kgr.toLocaleString('id-ID')}</h2>
          </div>
        </>
      )}
    </div>
  );
};
export default Dashboard;
