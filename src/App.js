import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataWarga from './pages/DataWarga';
import InputData from './pages/InputData';

function App() {
  const [user, setUser] = useState(null); // Menyimpan info login {role, name}
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', minHeight: '100vh', backgroundColor: '#fff' }}>
      <header style={{ padding: '20px', textAlign: 'center', borderBottom: '2px solid #eee' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>SIMAKARTI</h1>
        <p style={{ margin: 0, fontSize: '11px', fontWeight: 'bold' }}>SISTEM INFORMASI MANAJEMEN KAS RT TIGA</p>
        <p style={{ fontSize: '12px', color: '#3498db' }}>Login Sebagai: {user.role.toUpperCase()}</p>
      </header>

      <nav style={{ display: 'flex', background: '#2c3e50', padding: '5px' }}>
        <button onClick={() => setCurrentPage('dashboard')} style={navBtn}>Dashboard</button>
        <button onClick={() => setCurrentPage('warga')} style={navBtn}>Warga</button>
        {/* Hanya Admin/Bendahara/Sekretaris/Dawis yang bisa input */}
        {['ketua', 'bendahara', 'sekretaris', 'dawis'].includes(user.role) && (
          <button onClick={() => setCurrentPage('input')} style={navBtn}>Input</button>
        )}
        <button onClick={() => setUser(null)} style={{ ...navBtn, background: '#e74c3c' }}>Keluar</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {currentPage === 'dashboard' && <Dashboard role={user.role} />}
        {currentPage === 'warga' && <DataWarga role={user.role} />}
        {currentPage === 'input' && <InputData role={user.role} />}
      </main>
    </div>
  );
}

const navBtn = { flex: 1, padding: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px' };

export default App;
