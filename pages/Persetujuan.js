import React from 'react';

const Persetujuan = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-slate-800 p-5 shadow-lg text-white flex items-center sticky top-0 z-20">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-2xl">←</button>
        <h1 className="text-lg font-bold">Validasi Kas</h1>
      </nav>

      <main className="p-4 max-w-md mx-auto">
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">✨</span>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Belum ada pengajuan baru</p>
        </div>
        <button onClick={() => window.location.href='/dashboard'} className="w-full py-4 bg-gray-200 rounded-2xl text-gray-600 font-black text-[10px] uppercase">Kembali</button>
      </main>
    </div>
  );
};

export default Persetujuan;