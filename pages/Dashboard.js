import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = ({ role }) => {
  const [saldoRT, setSaldoRT] = useState(0);
  const [saldoKGR, setSaldoKGR] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('transaksi_kas').select('*');
      let rt = 0; let kgr = 0;
      data?.forEach(t => {
        if (t.kategori_kas === 'KGR') {
          t.jenis_transaksi === 'Pemasukan' ? kgr += t.nominal : kgr -= t.nominal;
        } else {
          t.jenis_transaksi === 'Pemasukan' ? rt += t.nominal : rt -= t.nominal;
        }
      });
      setSaldoRT(rt); setSaldoKGR(kgr);
    };
    fetchData();
  }, []);

  return (
    <div>
      <h3>📊 Dashboard Kas RT 03</h3>
      <div style={{ background: '#2980b9', color: 'white', padding: '20px', borderRadius: '15px', marginBottom: '15px' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Kas Umum RT</p>
        <h2>Rp {saldoRT.toLocaleString('id-ID')}</h2>
      </div>
      <div style={{ background: '#27ae60', color: 'white', padding: '20px', borderRadius: '15px' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>Kas KGR (Kematian)</p>
        <h2>Rp {saldoKGR.toLocaleString('id-ID')}</h2>
      </div>
    </div>
  );
};

export default Dashboard;
