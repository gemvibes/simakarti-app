import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const InputDawis = () => {
  const [user, setUser] = useState(null);
  const [daftarWarga, setDaftarWarga] = useState([]);
  const [selectedWarga, setSelectedWarga] = useState('');
  const [kategoriKas, setKategoriKas] = useState('RT');
  const [nominal, setNominal] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user_simakarti');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
      // Simulasi daftar warga jika Supabase belum connect
      setDaftarWarga([
        { id: 1, nama: 'Bp. Ahmad (KK)' },
        { id: 2, nama: 'Bp. Budi (KK)' },
        { id: 3, nama: 'Bp. Cecep (KK)' }
      ]);
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulasi Berhasil
    setTimeout(() => {
      alert('Berhasil dikirim! Menunggu persetujuan Bendahara.');
      window.location.href = '/dashboard';
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 font-sans">
      <nav className="bg-blue-600 p-5 shadow-lg text-white flex items-center sticky top-0 z-20">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-2xl">←</button>
        <div>
          <h1 className="text-lg font-bold">Setoran Dawis {user?.kelompok_dawis}</h1>
          <p className="text-[10px] opacity-70 uppercase tracking-widest font-black">Petugas: {user?.nama}</p>
        </div>
      </nav>

      <main className="p-4 max-w-md mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Pilih Warga</label>
            <select 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedWarga}
              onChange={(e) => setSelectedWarga(e.target.value)}
              required
            >
              <option value="">-- Pilih Nama --</option>
              {daftarWarga.map(w => <option key={w.id} value={w.id}>{w.nama}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Jenis Kas</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setKategoriKas('RT')} className={`py-3 rounded-xl font-bold text-xs ${kategoriKas === 'RT' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>KAS RT</button>
              <button type="button" onClick={() => setKategoriKas('KGR')} className={`py-3 rounded-xl font-bold text-xs ${kategoriKas === 'KGR' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>KAS KGR</button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nominal (Rp)</label>
            <input 
              type="number" 
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl font-black text-xl outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition"
          >
            {loading ? 'Mengirim...' : 'Kirim Setoran'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default InputDawis;