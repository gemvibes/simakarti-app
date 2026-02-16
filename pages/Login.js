import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  const users = {
    'ketua': 'rt03oke',
    'sekretaris': 'sekretaris03',
    'bendahara': 'bendahara03',
    'dawis': 'dawis03',
    'humas': 'humas03',
    'warga': 'warga03'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (users[u] && users[u] === p) {
      onLogin({ role: u });
    } else {
      alert('Username atau Password salah!');
    }
  };

  return (
    <div style={{ padding: '50px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>SIMAKARTI</h2>
      <p style={{ fontSize: '12px' }}>Sistem Informasi Manajemen Kas RT Tiga</p>
      <form onSubmit={handleLogin} style={{ display: 'inline-block', textAlign: 'left', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <label>Jabatan (Username)</label><br/>
        <input type="text" placeholder="contoh: bendahara" value={u} onChange={e => setU(e.target.value.toLowerCase())} style={inputS} /><br/>
        <label>Password</label><br/>
        <input type="password" value={p} onChange={e => setP(e.target.value)} style={inputS} /><br/>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#2c3e50', color: 'white', borderRadius: '5px' }}>MASUK</button>
      </form>
    </div>
  );
};

const inputS = { width: '100%', padding: '10px', margin: '10px 0', boxSizing: 'border-box' };
export default Login;
