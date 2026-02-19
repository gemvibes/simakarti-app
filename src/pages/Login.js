import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const users = [
    { username: 'ketua',      password: 'rt03oke',      role: 'ketua' },
    { username: 'sekretaris', password: 'sekretaris03', role: 'sekretaris' },
    { username: 'bendahara',  password: 'uangrt03',     role: 'bendahara' },
    { username: 'humas',      password: 'humasrt03',    role: 'humas' },
    { username: 'warga',      password: 'warga03',      role: 'warga' },
    { username: 'dawis1',     password: 'dawis03',      role: 'dawis1' },
    { username: 'dawis2',     password: 'dawis03',      role: 'dawis2' },
    { username: 'dawis3',     password: 'dawis03',      role: 'dawis3' },
    { username: 'dawis4',     password: 'dawis03',      role: 'dawis4' },
    { username: 'dawis5',     password: 'dawis03',      role: 'dawis5' },
    { username: 'dawis6',     password: 'dawis03',      role: 'dawis6' },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const input = username.trim().toLowerCase();
    const found = users.find(u => u.username === input && u.password === password);
    if (found) {
      setError('');
      onLogin(found);
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>

        {/* Logo & Judul */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '52px', marginBottom: '10px' }}>🏘️</div>
          <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '800', color: '#0f766e', letterSpacing: '2px' }}>
            SIMAKARTI
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', letterSpacing: '0.3px' }}>
            Sistem Informasi Manajemen Kas RT Tiga
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={errorStyle}>{error}</div>
        )}

        {/* Username */}
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
            style={inputStyle}
            placeholder="Masukkan username"
            autoComplete="username"
            required
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '28px' }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              style={inputStyle}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={eyeStyle}
              title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </span>
          </div>
        </div>

        {/* Tombol Masuk */}
        <button type="submit" style={btnStyle}>
          Masuk Sekarang
        </button>

        {/* Footer */}
        <p style={{ marginTop: '28px', fontSize: '11px', color: '#94a3b8', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          RT 03 RW 03 — Manajemen Digital
        </p>
      </form>
    </div>
  );
};

const containerStyle = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  minHeight: '100vh', padding: '20px',
  background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 50%, #99f6e4 100%)'
};
const cardStyle = {
  background: 'white', padding: '40px', borderRadius: '20px',
  boxShadow: '0 20px 60px rgba(15,118,110,0.15)', width: '100%', maxWidth: '380px'
};
const labelStyle = {
  display: 'block', marginBottom: '8px', fontSize: '13px',
  fontWeight: '600', color: '#374151'
};
const inputStyle = {
  width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0',
  borderRadius: '10px', boxSizing: 'border-box', fontSize: '14px',
  outline: 'none', transition: 'border 0.2s', color: '#1e293b'
};
const eyeStyle = {
  position: 'absolute', right: '13px', top: '50%',
  transform: 'translateY(-50%)', cursor: 'pointer',
  fontSize: '18px', userSelect: 'none'
};
const btnStyle = {
  width: '100%', padding: '14px', background: '#0f766e',
  color: 'white', border: 'none', borderRadius: '10px',
  cursor: 'pointer', fontWeight: '700', fontSize: '15px',
  letterSpacing: '0.5px', transition: 'background 0.2s'
};
const errorStyle = {
  background: '#fff5f5', color: '#c0392b', padding: '12px',
  borderRadius: '8px', marginBottom: '16px', fontSize: '13px',
  textAlign: 'center', border: '1px solid #fecaca'
};

export default Login;
