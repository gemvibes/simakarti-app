import React, { useState, useEffect } from 'react';

const Dashboard = ({ supabase }) => {
  const [saldoRT, setSaldoRT] = useState(0);
  const [saldoKGR, setSaldoKGR] = useState(0);

  useEffect(() => {
    const fetchSaldo = async () => {
      const { data } = await supabase.from('transaksi_kas').select('*');
      let rt = 0;
      let kgr = 0;
      data?.forEach(t => {
        // Logika pemisahan Kas RT dan KGR (Kematian)
        if (t.kategori_kas === 'KGR') {
          t.jenis_transaksi === 'Pemasukan' ? kgr += t.nominal : kgr -= t.nominal;
        } else {
          t.jenis_transaksi === 'Pemasukan' ? rt += t.nominal : rt -= t.nominal;
        }
      });
      setSaldoRT(rt);
      setSaldoKGR(kgr);
    };
    fetchSaldo();
  }, [supabase]);

  return (
    <div>
      <div style={{ background: '#2980b9', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '10px' }}>
        <p style={{ margin: 0 }}>Total Kas RT 03</p>
        <h2>Rp {saldoRT.toLocaleString('id-ID')}</h2>
      </div>
      <div style={{ background: '#27ae60', color: 'white', padding: '20px', borderRadius: '10px' }}>
        <p style={{ margin: 0 }}>Total Kas KGR (Kematian)</p>
        <h2>Rp {saldoKGR.toLocaleString('id-ID')}</h2>
      </div>
    </div>
  );
};

export default Dashboard;
