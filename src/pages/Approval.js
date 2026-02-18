import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const Approval = ({ user }) => {
  const [bundels, setBundels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchPendingBundels(); }, []);

  const fetchPendingBundels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('mutasi_kas')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const grouped = data.reduce((acc, item) => {
        const key = item.bundel_id || item.id;
        if (!acc[key]) {
          acc[key] = { id: key, bundel_id: item.bundel_id, pj: item.pj, total: 0, items: [], tgl: item.created_at };
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
      ({ error } = await supabase.from('mutasi_kas').update({ status: 'APPROVED' }).eq('bundel_id', bundel.bundel_id));
    } else {
      ({ error } = await supabase.from('mutasi_kas').update({ status: 'APPROVED' }).in('id', bundel.items.map(i => i.id)));
    }
    if (!error) { alert('✅ Setoran berhasil diterima dan masuk ke Saldo Kas!'); fetchPendingBundels(); }
    else alert('Gagal: ' + error.message);
  };

  const handleTolak = async (bundel) => {
    const alasan = window.prompt('Masukkan alasan penolakan (akan dilihat oleh Dawis):');
    if (alasan === null) return; // user klik cancel
    if (!alasan.trim()) { alert('Alasan tidak boleh kosong.'); return; }

    // Kita tandai dengan status REJECTED tapi simpan alasan di keterangan
    let error;
    const catatan = `[DITOLAK: ${alasan}]`;
    if (bundel.bundel_id) {
      // Update keterangan tiap item dengan alasan, status kembali ke PENDING agar bisa diedit dawis
      for (const item of bundel.items) {
        await supabase.from('mutasi_kas').update({
          status: 'PENDING',
          keterangan: `${item.keterangan} ${catatan}`
        }).eq('id', item.id);
      }
    } else {
      for (const item of bundel.items) {
        await supabase.from('mutasi_kas').update({
          status: 'PENDING',
          keterangan: `${item.keterangan} ${catatan}`
        }).eq('id', item.id);
      }
    }

    alert(`⚠️ Setoran dari ${bundel.pj.toUpperCase()} telah dikembalikan.\nAlasan: ${alasan}\nDawis dapat mengedit dan mengirim ulang.`);
    fetchPendingBundels();
  };

  const handleTolakApproved = async (bundel) => {
    // Khusus untuk membatalkan yang sudah APPROVED — akan muncul di tab terpisah jika dibutuhkan
    if (!window.confirm(`Batalkan approval setoran dari ${bundel.pj.toUpperCase()}? Saldo akan berkurang kembali.`)) return;
    let error;
    if (bundel.bundel_id) {
      ({ error } = await supabase.from('mutasi_kas').update({ status: 'PENDING' }).eq('bundel_id', bundel.bundel_id));
    } else {
      ({ error } = await supabase.from('mutasi_kas').update({ status: 'PENDING' }).in('id', bundel.items.map(i => i.id)));
    }
    if (!error) { alert('↩️ Setoran dikembalikan ke PENDING. Dawis dapat mengedit kembali.'); fetchPendingBundels(); }
    else alert('Gagal: ' + error.message);
  };

  if (loading) return <div style={{ padding: '20px' }}>Memuat antrean setoran...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ borderBottom: '2px solid #27ae60', paddingBottom: '10px' }}>📥 Persetujuan Setoran Dawis</h3>

      <div style={{ background: '#fef9e7', border: '1px solid #f1c40f', borderRadius: '10px', padding: '12px 15px', marginBottom: '20px', fontSize: '13px', color: '#7d6608' }}>
        💡 <strong>Panduan:</strong> Klik <strong>TERIMA</strong> jika uang sudah diterima secara fisik. Klik <strong>TOLAK</strong> jika ada kesalahan — setoran akan dikembalikan ke Dawis untuk diperbaiki.
      </div>

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
                {new Date(b.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;|&nbsp; {b.items.length} transaksi
              </p>
              {/* Rincian */}
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #eee' }}>
                {b.items.map(item => (
                  <div key={item.id} style={{ fontSize: '12px', color: '#555', padding: '2px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.keterangan}</span>
                    <span style={{ fontWeight: 'bold', color: item.tipe_kas === 'RT' ? '#27ae60' : '#2980b9' }}>
                      [{item.tipe_kas}] Rp {Number(item.jumlah).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
              <div style={totalStyle}>Total: Rp {b.total.toLocaleString('id-ID')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '120px' }}>
              <button onClick={() => handleApprove(b)} style={btnApprove}>✅ TERIMA</button>
              <button onClick={() => handleTolak(b)} style={btnTolak}>❌ TOLAK</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const cardStyle = { background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '5px solid #f1c40f' };
const badgeStyle = { background: '#f3f4f6', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#7f8c8d' };
const totalStyle = { marginTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#27ae60' };
const btnApprove = { background: '#27ae60', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const btnTolak = { background: '#e74c3c', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };

export default Approval;
