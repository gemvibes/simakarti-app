import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Approval = ({ user }) => {
  const [bundels, setBundels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingBundels();
  }, []);

  const fetchPendingBundels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const grouped = data.reduce((acc, item) => {
        // Jika bundel_id null/kosong, pakai id transaksi itu sendiri sebagai key
        const key = item.bundel_id || item.id;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            bundel_id: item.bundel_id,
            pj: item.pj,
            total: 0,
            items: [],
            tgl: item.created_at
          };
        }
        acc[key].total += Number(item.jumlah);
        acc[key].items.push(item);
        return acc;
      }, {});
      setBundels(Object.values(grouped));
    }
    setLoading(false);
  };

  const handleApprove = async (bundel) => {
    if (!window.confirm('Konfirmasi: Apakah uang fisik sudah diterima dengan benar?')) return;

    let error;
    if (bundel.bundel_id) {
      // Approve berdasarkan bundel_id
      ({ error } = await supabase
        .from('mutasi_kas')
        .update({ status: 'APPROVED' })
        .eq('bundel_id', bundel.bundel_id));
    } else {
      // Approve satu per satu berdasarkan id transaksi
      const ids = bundel.items.map(i => i.id);
      ({ error } = await supabase
        .from('mutasi_kas')
        .update({ status: 'APPROVED' })
        .in('id', ids));
    }

    if (!error) {
      alert('✅ Setoran berhasil diterima dan masuk ke Saldo Kas!');
      fetchPendingBundels();
    } else {
      alert('Gagal: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Memuat antrean setoran...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>📥 Persetujuan Setoran Dawis</h3>

      {bundels.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#95a5a6', background: 'white', borderRadius: '12px' }}>
          ☕ Tidak ada antrean setoran saat ini.
        </div>
      ) : (
        bundels.map((b) => (
          <div key={b.id} style={cardStyle}>
            <div style={{ flex: 1 }}>
              <span style={badgeStyle}>{b.bundel_id ? `Bundel: ${b.bundel_id}` : `ID: ${b.id.slice(0, 8)}...`}</span>
              <h4 style={{ margin: '10px 0 5px 0' }}>Setoran dari: {(b.pj || '-').toUpperCase()}</h4>
              <p style={{ margin: 0, color: '#7f8c8d', fontSize: '13px' }}>
                Tanggal: {new Date(b.tgl).toLocaleDateString('id-ID')} &nbsp;|&nbsp; {b.items.length} transaksi
              </p>
              {/* Rincian per item */}
              <div style={{ marginTop: '8px' }}>
                {b.items.map(item => (
                  <div key={item.id} style={{ fontSize: '12px', color: '#555', padding: '3px 0' }}>
                    • {item.keterangan} —
                    <span style={{ color: '#27ae60', fontWeight: 'bold' }}> Rp {Number(item.jumlah).toLocaleString('id-ID')}</span>
                    <span style={{ marginLeft: '5px', background: item.tipe_kas === 'RT' ? '#e8f5e9' : '#e3f2fd', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>{item.tipe_kas}</span>
                  </div>
                ))}
              </div>
              <div style={totalStyle}>Total: Rp {b.total.toLocaleString('id-ID')}</div>
            </div>
            <button onClick={() => handleApprove(b)} style={btnApprove}>TERIMA UANG</button>
          </div>
        ))
      )}
    </div>
  );
};

const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #f1c40f' };
const badgeStyle = { background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#7f8c8d' };
const totalStyle = { marginTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#27ae60' };
const btnApprove = { background: '#27ae60', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' };

export default Approval;
