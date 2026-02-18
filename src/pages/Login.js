import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPanduan, setShowPanduan] = useState(false);
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

  const panduanAkun = [
    { label: 'Ketua RT',    username: 'ketua',      pw: 'rt03oke' },
    { label: 'Sekretaris',  username: 'sekretaris', pw: 'sekretaris03' },
    { label: 'Bendahara',   username: 'bendahara',  pw: 'uangrt03' },
    { label: 'Humas',       username: 'humas',      pw: 'humasrt03' },
    { label: 'Warga Umum',  username: 'warga',      pw: 'warga03' },
    { label: 'Dawis I–VI',  username: 'dawis1 s/d dawis6', pw: 'dawis03' },
  ];

  return (
    <div style={containerStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>🏘️</div>
          <h2 style={{ margin: 0, color: '#2c3e50', letterSpacing: '1px' }}>SIMAKARTI 03</h2>
          <p style={{ color: '#7f8c8d', fontSize: '13px', marginTop: '5px' }}>RT 03 RW 03 — Manajemen Digital</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            style={inputStyle}
            placeholder="Contoh: humas, bendahara, dawis1"
            autoComplete="username"
            required
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              style={inputStyle}
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
            <span onClick={() => setShowPassword(!showPassword)} style={eyeStyle}>
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </span>
          </div>
        </div>

        <button type="submit" style={btnStyle}>Masuk Sekarang</button>

        {/* Panduan akun — bisa dibuka/tutup */}
        <div style={{ marginTop: '20px' }}>
          <button type="button" onClick={() => setShowPanduan(!showPanduan)}
            style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '13px', width: '100%', textAlign: 'center' }}>
            {showPanduan ? '▲ Sembunyikan Panduan Akun' : '▼ Lihat Panduan Username & Password'}
          </button>

          {showPanduan && (
            <div style={{ marginTop: '12px', background: '#f8f9fa', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eee' }}>
              <div style={{ background: '#2c3e50', color: 'white', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }}>
                📋 Daftar Akun SIMAKARTI 03
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#ecf0f1' }}>
                    <th style={thP}>Jabatan</th>
                    <th style={thP}>Username</th>
                    <th style={thP}>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {panduanAkun.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #eee', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={tdP}>{a.label}</td>
                      <td style={{ ...tdP, fontWeight: 'bold', color: '#2c3e50', fontFamily: 'monospace' }}>{a.username}</td>
                      <td style={{ ...tdP, fontFamily: 'monospace', color: '#7f8c8d' }}>{a.pw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '8px 12px', fontSize: '11px', color: '#e74c3c', background: '#fff5f5' }}>
                ⚠️ Jaga kerahasiaan password. Jangan bagikan ke orang yang tidak berkepentingan.
              </div>
            </div>
          )}
        </div>

        <div style={{ marginTop: '20px', fontSize: '11px', color: '#bdc3c7', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          Sistem Informasi Manajemen Administrasi<br />Keuangan & RT 03 RW 03
        </div>
      </form>
    </div>
  );
};

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', padding: '20px' };
const cardStyle = { background: 'white', padding: '35px', borderRadius: '16px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' };
const labelStyle = { display: 'block', marginBottom: '7px', fontSize: '13px', fontWeight: '600', color: '#34495e' };
const inputStyle = { width: '100%', padding: '12px 15px', border: '1.5px solid #dfe6e9', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px', outline: 'none' };
const eyeStyle = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '18px', userSelect: 'none' };
const btnStyle = { width: '100%', padding: '14px', background: '#3498db', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' };
const errorStyle = { background: '#fff5f5', color: '#c0392b', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', border: '1px solid #feb2b2' };
const thP = { padding: '7px 10px', textAlign: 'left', color: '#555', fontWeight: 'bold' };
const tdP = { padding: '7px 10px', color: '#333' };

export default Login;
