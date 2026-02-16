import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [saldoRT, setSaldoRT] = useState(0);
  const [saldoKGR, setSaldoKGR] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ambil data user dari local storage
    const loggedInUser = localStorage.getItem('user_simakarti');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    } else {
      // Jika belum login, lempar ke halaman login
      window.location.href = '/login'; 
    }

    fetchSaldo();
  }, []);

  const fetchSaldo = async () => {
    setLoading(true);
    
    // 2. Ambil semua transaksi yang sudah disetujui (Approved)
    const { data, error } = await supabase
      .from('transaksi_kas')
      .select('*')
      .eq('status_approval', 'approved');

    if (error) {
      console.error('Gagal mengambil saldo:', error);
      // Jika belum ada table di supabase, kita set saldo default saja agar tidak error
      setSaldoRT(0);
      setSaldoKGR(0);
    } else if (data) {
      // 3. Hitung Saldo RT dan KGR secara dinamis
      let totalRT = 0;
      let totalKGR = 0;

      data.forEach((trx) => {
        const nominal = parseFloat(trx.nominal);
        if (trx.kategori_kas === 'RT') {
          trx.jenis_transaksi === 'masuk' ? totalRT += nominal : totalRT -= nominal;
        } else if (trx.kategori_kas === 'KGR') {
          trx.jenis_transaksi === 'masuk' ? totalKGR += nominal : totalKGR -= nominal;
        }
      });

      setSaldoRT(totalRT);
      setSaldoKGR(totalKGR);
    }
    setLoading(false);
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(num);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar Mobile Friendly */}
      <nav className="bg-blue-600 p-4 shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center text-white max-w-4xl mx-auto">
          <div>
            <h1 className="text-xl font-bold tracking-tight">SIMAKARTI</h1>
            <p className="text-[10px] opacity-80 italic">RT 03 RW 03 Purwokerto Lor</p>
          </div>
          <button 
            onClick={() => window.location.href='/profil'}
            className="flex flex-col items-end"
          >
            <p className="text-[10px] bg-blue-800 px-2 py-0.5 rounded uppercase font-bold">{user?.peran}</p>
            <p className="text-sm font-medium">{user?.nama}</p>
          </button>
        </div>
      </nav>

      <main className="p-4 space-y-4 max-w-4xl mx-auto">
        {/* Ringkasan Saldo Utama */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-xl text-white">
          <div className="mb-4">
            <p className="text-xs opacity-80 mb-1 font-semibold uppercase tracking-wider">Total Saldo Kas RT</p>
            <h2 className="text-3xl font-bold">{loading ? '...' : formatRupiah(saldoRT)}</h2>
          </div>
          <div className="pt-4 border-t border-blue-400/30">
            <p className="text-xs opacity-80 mb-1 font-semibold uppercase tracking-wider">Total Saldo Kas KGR</p>
            <h2 className="text-xl font-bold">{loading ? '...' : formatRupiah(saldoKGR)}</h2>
          </div>
        </div>

        {/* Menu Grid - Akses Cepat */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Menu Khusus Bendahara & Superadmin */}
          {(user?.peran === 'bendahara' || user?.peran === 'superadmin') && (
            <>
              <button 
                onClick={() => window.location.href='/persetujuan'}
                className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-blue-50 transition"
              >
                <span className="text-3xl mb-2">🔔</span>
                <span className="text-[11px] font-bold text-gray-700 uppercase">Persetujuan</span>
              </button>

              <button 
                onClick={() => window.location.href='/input-pengeluaran'}
                className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-red-50 transition"
              >
                <span className="text-3xl mb-2">💸</span>
                <span className="text-[11px] font-bold text-gray-700 uppercase">Pengeluaran</span>
              </button>
            </>
          )}

          {/* Menu Khusus Dawis & Superadmin */}
          {(user?.peran?.includes('dawis') || user?.peran === 'superadmin') && (
            <button 
              onClick={() => window.location.href='/input-dawis'}
              className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-blue-50 transition"
            >
              <span className="text-3xl mb-2">💰</span>
              <span className="text-[11px] font-bold text-gray-700 uppercase">Iuran Dawis</span>
            </button>
          )}

          {/* Menu Khusus Humas & Superadmin */}
          {(user?.peran === 'humas' || user?.peran === 'superadmin') && (
            <button 
              onClick={() => window.location.href='/input-toko'}
              className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-orange-50 transition"
            >
              <span className="text-3xl mb-2">🏬</span>
              <span className="text-[11px] font-bold text-gray-700 uppercase">Kas Toko</span>
            </button>
          )}

          {/* Menu Khusus Sekretaris & Superadmin */}
          {(user?.peran === 'sekretaris' || user?.peran === 'superadmin') && (
            <button 
              onClick={() => window.location.href='/sekretaris'}
              className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-emerald-50 transition"
            >
              <span className="text-3xl mb-2">📋</span>
              <span className="text-[11px] font-bold text-gray-700 uppercase">Presensi</span>
            </button>
          )}

          {/* Menu Umum (Bisa diakses siapa saja) */}
          <button 
            onClick={() => window.location.href='/laporan-kas'}
            className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-blue-50 transition"
          >
            <span className="text-3xl mb-2">📊</span>
            <span className="text-[11px] font-bold text-gray-700 uppercase">Laporan Kas</span>
          </button>

          <button 
            onClick={() => window.location.href='/profil'}
            className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-sm border border-gray-100 active:bg-indigo-50 transition"
          >
            <span className="text-3xl mb-2">👤</span>
            <span className="text-[11px] font-bold text-gray-700 uppercase">Profil & Pass</span>
          </button>

        </div>

        {/* Footer Info */}
        <div className="pt-8 text-center">
          <div className="inline-block p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-left">
            <h4 className="text-[10px] font-black text-yellow-800 uppercase mb-1">Status Sistem:</h4>
            <p className="text-[10px] text-yellow-700 leading-tight">
              Aplikasi berjalan dalam mode pengembangan (Mock/Local). Data transaksi memerlukan koneksi Supabase untuk penyimpanan permanen.
            </p>
          </div>
          <p className="mt-6 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
            © 2026 SIMAKARTI Dev Team
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;