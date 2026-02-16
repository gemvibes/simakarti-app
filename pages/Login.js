import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  // Daftar Akun SIMAKARTI
  const users = {
    'ketua': 'rt03oke',
    'sekretaris': 'sekretaris03',
    'bendahara': 'bendahara03',
    'humas': 'humas03',
    'warga': 'warga03',
    // Akun Dawis 1-6
    'dawis1': 'dawis03', 'dawis2': 'dawis03', 'dawis3': 'dawis03',
    'dawis4': 'dawis03', 'dawis5': 'dawis03', 'dawis6': 'dawis03'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const username = u.toLowerCase();
    if (users[username] && users[username] === p) {
      onLogin({ role: username });
    } else {
      alert('Username atau Password salah!');
    }
  };

  return (
    <div style={{ padding: '50px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#2c3e50', marginBottom: '5px' }}>SIMAKARTI</h1>
      <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#7f8c8d' }}>SISTEM INFORMASI MANAJEMEN KAS RT TIGA</p>
      <div style={{ display: 'inline-block', textAlign: 'left', padding: '30px', border: '1px solid #ddd', borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleLogin}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Jabatan / Akun Dawis</label><br/>
          <input type="text" placeholder="contoh: bendahara / dawis1" value={u} onChange={e => setU(e.target.value)} style={inputS} /><br/>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password</label><br/>
          <input type="password" value={p} onChange={e => setP(e.target.value)} style={inputS} /><br/>
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>MASUK</button>
        </form>
      </div>
    </div>
  );
};

const inputS = { width: '100%', padding: '12px', margin: '8px 0 20px 0', border: '1px solid #ddd', borderRadius: '8px', boxSizing: 'border-box' };
export default Login;
