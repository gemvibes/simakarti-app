import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');

  const users = {
    'ketua': 'rt03oke',
    'sekretaris': 'sekretaris03',
    'bendahara': 'bendahara03',
    'humas': 'humas03', // Akun Humas Aktif
    'warga': 'warga03',
    'dawis1': 'dawis03', 'dawis2': 'dawis03', 'dawis3': 'dawis03',
    'dawis4': 'dawis03', 'dawis5': 'dawis03', 'dawis6': 'dawis03'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const userLower = u.toLowerCase();
    if (users[userLower] && users[userLower] === p) {
      onLogin({ role: userLower });
    } else {
      alert('Login Gagal! Username atau Password salah.');
    }
  };

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h2>SIMAKARTI</h2>
      <p style={{ fontSize: '11px', fontWeight: 'bold' }}>SISTEM INFORMASI MANAJEMEN KAS RT TIGA</p>
      <div style={{ display: 'inline-block', textAlign: 'left', padding: '25px', border: '1px solid #ddd', borderRadius: '15px', background: '#fff' }}>
        <form onSubmit={handleLogin}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Jabatan / Akun</label>
          <input type="text" value={u} onChange={e => setU(e.target.value)} style={inS} placeholder="humas / dawis1 / bendahara" />
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Password</label>
          <input type="password" value={p} onChange={e => setP(e.target.value)} style={inS} />
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>LOGIN</button>
        </form>
      </div>
    </div>
  );
};
const inS = { width: '100%', padding: '10px', margin: '8px 0 15px 0', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' };
export default Login;
