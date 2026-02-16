import React, { useState } from 'react';

const InputPengeluaran = () => {
  const [nominal, setNominal] = useState('');
  const [ket, setKet] = useState('');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 p-5 shadow-lg text-white flex items-center sticky top-0 z-20">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-2xl">←</button>
        <h1 className="text-lg font-bold uppercase tracking-tighter">Catat Pengeluaran</h1>
      </nav>

      <main className="p-4 max-w-md mx-auto">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-6">
          <input type="number" placeholder="Nominal (Rp)" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-xl" value={nominal} onChange={(e)=>setNominal(e.target.value)} />
          <textarea placeholder="Untuk keperluan apa?" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm" rows="3" value={ket} onChange={(e)=>setKet(e.target.value)} />
          <button onClick={() => {alert('Pengeluaran dicatat!'); window.location.href='/dashboard';}} className="w-full bg-red-600 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-lg">Simpan & Potong Saldo</button>
        </div>
      </main>
    </div>
  );
};

export default InputPengeluaran;