import React, { useState, useEffect } from 'react';
// ... import lainnya ...

function App() {
  // Ambil data user dari localStorage jika ada saat pertama kali buka
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('simakarti_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Fungsi Login Baru
  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('simakarti_user', JSON.stringify(userData));
  };

  // Fungsi Logout Baru
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simakarti_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Kirim handleLogout ke sidebar/header kamu */}
      <button onClick={handleLogout} style={{float:'right'}}>Keluar</button>
      {/* ... sisa kodingan dashboard kamu ... */}
    </div>
  );
}
