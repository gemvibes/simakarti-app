import React, { useState } from 'react';

const Sekretaris = () => {
  const [judul, setJudul] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-emerald-700 p-5 shadow-lg text-white flex items-center sticky top-0 z-20">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-2xl">←</button>
        <h1 className="text-lg font-bold uppercase tracking-tighter">Presensi & Notulen</h1>
      </nav>

      <main className="p-4 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-5">
          <input type="text" placeholder="Agenda Rapat" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold" value={judul} onChange={(e)=>setJudul(e.target.value)} />
          <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-300 text-center text-xs text-gray-400 italic">
            Daftar warga akan muncul di sini setelah Supabase terhubung.
          </div>
          <button onClick={() => {alert('Data Rapat Disimpan!'); window.location.href='/dashboard';}} className="w-full bg-emerald-700 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-lg">Simpan Pertemuan</button>
        </div>
      </main>
    </div>
  );
};

export default Sekretaris;