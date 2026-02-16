import React, { useEffect, useState } from 'react';

const InputToko = () => {
  const [user, setUser] = useState(null);
  const [nominal, setNominal] = useState('');
  const [toko, setToko] = useState('');

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user_simakarti');
    if (loggedInUser) setUser(JSON.parse(loggedInUser));
    else window.location.href = '/login';
  }, []);

  const handleKirim = (e) => {
    e.preventDefault();
    alert('Setoran Toko ' + toko + ' Berhasil!');
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-orange-600 p-5 shadow-lg text-white flex items-center sticky top-0 z-20">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-2xl">←</button>
        <h1 className="text-lg font-bold uppercase tracking-tighter">Setoran Kas Toko</h1>
      </nav>

      <main className="p-4 max-w-md mx-auto">
        <form onSubmit={handleKirim} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nama Toko</label>
            <select className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold" value={toko} onChange={(e)=>setToko(e.target.value)} required>
              <option value="">-- Pilih Toko --</option>
              <option value="Dunia Baru">Toko Dunia Baru</option>
              <option value="Sekar Jagad">Sekar Jagad</option>
              <option value="ERHA">ERHA</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nominal Setoran</label>
            <input type="number" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-xl" placeholder="0" value={nominal} onChange={(e)=>setNominal(e.target.value)} required />
          </div>
          <button type="submit" className="w-full bg-orange-600 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-lg">Setor Sekarang</button>
        </form>
      </main>
    </div>
  );
};

export default InputToko;