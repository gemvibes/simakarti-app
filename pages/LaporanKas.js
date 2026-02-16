import React, { useEffect, useState } from 'react';

const LaporanKas = () => {
  const [filterKas, setFilterKas] = useState('RT');
  const [transaksi, setTransaksi] = useState([]);

  useEffect(() => {
    // Data dummy untuk simulasi tampilan sebelum Supabase siap
    const dummyData = [
      { id: 1, tgl: '2026-02-10', sumber: 'Iuran Dawis 1 - Bp. Ahmad', nominal: 20000, tipe: 'masuk', kat: 'RT', ket: 'Iuran rutin' },
      { id: 2, tgl: '2026-02-12', sumber: 'Toko Dunia Baru', nominal: 150000, tipe: 'masuk', kat: 'RT', ket: 'Sewa lahan' },
      { id: 3, tgl: '2026-02-13', sumber: 'Beli Snack Rapat', nominal: 50000, tipe: 'keluar', kat: 'RT', ket: 'Rapat RT' },
      { id: 4, tgl: '2026-02-14', sumber: 'Iuran KGR - Bp. Budi', nominal: 10000, tipe: 'masuk', kat: 'KGR', ket: 'Kas Kematian' },
    ];
    setTransaksi(dummyData.filter(item => item.kat === filterKas));
  }, [filterKas]);

  const formatRupiah = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-slate-900 p-5 shadow-xl text-white sticky top-0 z-20 flex items-center">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-xl">⬅️</button>
        <h1 className="text-lg font-bold tracking-tight">Laporan Mutasi Kas</h1>
      </nav>

      <main className="p-4 max-w-2xl mx-auto">
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <button 
            onClick={() => setFilterKas('RT')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${filterKas === 'RT' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
          >
            KAS RT
          </button>
          <button 
            onClick={() => setFilterKas('KGR')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs transition-all ${filterKas === 'KGR' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-400'}`}
          >
            KAS KGR
          </button>
        </div>

        <div className="space-y-3">
          {transaksi.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex-1">
                <p className="text-[9px] font-black text-gray-300 uppercase mb-1">{item.tgl}</p>
                <h3 className="text-sm font-bold text-gray-800 leading-tight">{item.sumber}</h3>
                <p className="text-[10px] text-gray-500 italic mt-0.5">{item.ket}</p>
              </div>
              <div className="text-right ml-4">
                <p className={`text-sm font-black ${item.tipe === 'masuk' ? 'text-blue-600' : 'text-red-500'}`}>
                  {item.tipe === 'masuk' ? '+' : '-'} {formatRupiah(item.nominal)}
                </p>
                <div className={`text-[8px] inline-block px-1.5 py-0.5 rounded font-bold uppercase mt-1 ${item.tipe === 'masuk' ? 'bg-blue-50 text-blue-400' : 'bg-red-50 text-red-400'}`}>
                  {item.tipe}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LaporanKas;