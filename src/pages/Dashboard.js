import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [data, setData] = useState({ rt: 0, kgr: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSaldo = async () => {
    try {
      setLoading(true);
      const { data: transaksi, error } = await supabase.from('transaksi_kas').select('*');
      if (error) throw error;

      let saldoRT = 0;
      let saldoKGR = 0;

      transaksi?.forEach((t) => {
        const nom = Number(t.nominal) || 0;
        const tipe = t.jenis_transaksi; // 'Pemasukan' atau 'Pengeluaran'
        const kategori = t.kategori_kas; // 'RT' atau 'KGR'

        if (kategori === 'KGR') {
          tipe === 'Pemasukan' ? saldoKGR += nom : saldoKGR -= nom;
        } else {
          tipe === 'Pemasukan' ? saldoRT += nom : saldoRT -= nom;
        }
      });

      setData({ rt: saldoRT, kgr: saldoKGR });
    } catch (err) {
      console.error("Error load dashboard:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaldo();
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif' }}>
      <h3 style={{ borderLeft: '4px solid #2980b9', paddingLeft: '10px', marginBottom: '20px' }}>Dashboard Keuangan</h3>

      {loading ? (
        <p>Memuat Saldo...</p>
      ) : (
        <>
          {/* Kartu Kas Umum RT */}
          <div style={{ ...card, background: 'linear-gradient(135deg, #2980b9, #3498db)' }}>
            <p style={labelS}>Total Saldo Kas Umum RT</p>
            <h2 style={nominalS}>Rp {data.rt.toLocaleString('id-ID')}</h2>
          </div>

          {/* Kartu Kas KGR */}
          <div style={{ ...card, background: 'linear-gradient(135deg, #27ae60, #2ecc71)' }}>
            <p style={labelS}>Total Saldo Kas KGR (Kematian)</p>
            <h2 style={nominalS}>Rp {data.kgr.toLocaleString('id-ID')}</h2>
          </div>
        </>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '10px', fontSize: '12px', color: '#7f8c8d' }}>
        <strong>Catatan:</strong> Saldo dihitung otomatis berdasarkan seluruh transaksi masuk dan keluar yang telah diinput Bendahara.
      </div>
    </div>
  );
};

const card = { padding: '25px', borderRadius: '15px', color: 'white', marginBottom: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' };
const labelS = { margin: 0, fontSize: '14px', opacity: 0.9 };
const nominalS = { margin: '5px 0 0 0', fontSize: '28px', fontWeight: 'bold' };

export default Dashboard;
