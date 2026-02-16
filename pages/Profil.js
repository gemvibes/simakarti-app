import React, { useEffect, useState } from 'react';

const Profil = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user_simakarti');
    if (loggedInUser) setUser(JSON.parse(loggedInUser));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-indigo-700 p-5 text-white flex items-center shadow-lg">
        <button onClick={() => window.location.href='/dashboard'} className="mr-4 text-xl">⬅️</button>
        <h1 className="text-lg font-bold">Profil Pengguna</h1>
      </nav>

      <main className="p-6 max-w-md mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
          <div className="w-24 h-24 bg-indigo-50 rounded-full mx-auto flex items-center justify-center text-4xl border-4 border-white shadow-md mb-4">
            👤
          </div>
          <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">{user?.nama || 'Tamu'}</h2>
          <span className="inline-block px-4 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase mt-2">
            Akses: {user?.peran}
          </div>

          <div className="mt-8 space-y-4 text-left border-t pt-6">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Kelompok Dawis</span>
              <span className="text-sm font-bold text-gray-700">{user?.kelompok_dawis || 'Semua'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Status Akun</span>
              <span className="text-sm font-bold text-green-600 uppercase">Aktif</span>
            </div>
          </div>

          <button 
            onClick={() => { localStorage.removeItem('user_simakarti'); window.location.href='/login'; }}
            className="w-full mt-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-100 active:scale-95 transition"
          >
            Keluar dari Aplikasi
          </button>
        </div>
        
        <p className="mt-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
          Sistem Informasi Manajemen Kas RT<br/>Purwokerto Lor
        </p>
      </main>
    </div>
  );
};

export default Profil;