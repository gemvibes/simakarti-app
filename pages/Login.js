import React, { useState } from 'react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);

    // LOGIKA SEMENTARA (Tanpa Supabase):
    // Kita buat simulasi login sederhana agar kamu bisa tes masuk ke Dashboard
    setTimeout(() => {
      let role = 'warga';
      let kelompok = '0';

      // Simulasi pendeteksian role berdasarkan nama (untuk tes)
      const namaLow = username.toLowerCase();
      if (namaLow.includes('admin')) role = 'superadmin';
      else if (namaLow.includes('bendahara')) role = 'bendahara';
      else if (namaLow.includes('dawis')) {
        role = 'dawis';
        kelompok = '1';
      } else if (namaLow.includes('humas')) role = 'humas';
      else if (namaLow.includes('sekretaris')) role = 'sekretaris';

      const userData = {
        id: 'u1',
        nama: username,
        peran: role,
        kelompok_dawis: kelompok
      };

      localStorage.setItem('user_simakarti', JSON.stringify(userData));
      window.location.href = '/dashboard';
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-blue-600 p-8 text-center text-white">
          <h1 className="text-3xl font-black tracking-tighter">SIMAKARTI</h1>
          <p className="text-xs opacity-80 mt-1 uppercase tracking-widest font-bold">RT 03 Purwokerto Lor</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Nama Pengguna</label>
            <input
              type="text"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-black font-semibold outline-none transition"
              placeholder="Contoh: Bendahara"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1 ml-1">Kata Sandi</label>
            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 text-black font-semibold outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition duration-200 uppercase tracking-wider text-sm"
          >
            {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
          </button>
        </form>
        
        <div className="px-8 pb-8 text-center">
          <p className="text-[10px] text-gray-400 leading-relaxed italic">
            Gunakan nama "Admin", "Bendahara", atau "Dawis" untuk mencoba berbagai level akses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;