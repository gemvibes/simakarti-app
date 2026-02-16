import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [saldoRT, setSaldoRT] = useState(0);
  const [saldoKGR, setSaldoKGR] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('transaksi_kas').select('*');
      let rt = 0; let kgr = 0;
      data?.forEach(t => {
        const nominal = Number(t.nominal);
        if (t.kategori_kas === 'KGR') {
          t.jenis_transaksi === 'Pemasukan' ? kgr += nominal : kgr -= nominal;
        } else {
          t.jenis_transaksi === 'Pemasukan' ? rt += nominal : rt -= nominal;
        }
      });
      setSaldoRT(rt); setSaldoKGR(kgr);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h3 style={{ borderLeft: '4px solid #2c3e50', paddingLeft: '10px' }}>Dashboard Keuangan</h3>
      {loading ? <p>Menghitung Saldo...</p> : (
        <>
          <div style={{ background: 'linear-gradient(135deg, #2980b9, #3498db)', color: 'white', padding: '25px', borderRadius: '15px', marginBottom: '15px' }}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Kas Umum RT</p>
            <h2 style={{ margin: '5px 0 0 0' }}>Rp {saldoRT.toLocaleString('id-ID')}</h2>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: 'white', padding: '25px', borderRadius: '15px' }}>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total Kas KGR (Kematian)</p>
            <h2 style={{ margin: '5px 0 0 0' }}>Rp {saldoKGR.toLocaleString('id-ID')}</h2>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
