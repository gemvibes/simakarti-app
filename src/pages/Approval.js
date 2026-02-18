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
    // Mengambil data mutasi yang masih PENDING dan dikelompokkan berdasarkan bundel_id
    const { data, error } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Mengelompokkan data berdasarkan bundel_id untuk tampilan per bundel
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.bundel_id]) {
          acc[item.bundel_id] = { 
            id: item.bundel_id, 
            pj: item.pj, 
            total: 0, 
            items: [],
            tgl: item.created_at 
          };
        }
        acc[item.bundel_id].total += item.jumlah;
        acc[item.bundel_id].items.push(item);
        return acc;
      }, {});
      setBundels(Object.values(grouped));
    }
    setLoading(false);
  };

  const handleApprove = async (bundelId) => {
    if (!window.confirm("Konfirmasi: Apakah uang fisik sudah diterima dengan benar?")) return;

    const { error } = await supabase
      .from('mutasi_kas')
      .update({ status: 'APPROVED' })
      .eq('bundel_id', bundelId);

    if (!error) {
      alert("✅ Setoran berhasil diterima dan masuk ke Saldo Kas!");
      fetchPendingBundels();
    } else {
      alert("Gagal: " + error.message);
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
              <span style={badgeStyle}>ID: {b.id}</span>
              <h4 style={{ margin: '10px 0 5px 0' }}>Setoran dari: {b.pj.toUpperCase()}</h4>
              <p style={{ margin: 0, color: '#7f8c8d', fontSize: '13px' }}>Tanggal: {b.tgl}</p>
              <div style={totalStyle}>Total: Rp {b.total.toLocaleString('id-ID')}</div>
            </div>
            <button onClick={() => handleApprove(b.id)} style={btnApprove}>TERIMA UANG</button>
          </div>
        ))
      )}
    </div>
  );
};

const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #f1c40f' };
const badgeStyle = { background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#7f8c8d' };
const totalStyle = { marginTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#27ae60' };
const btnApprove = { background: '#27ae60', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };

export default Approval;
