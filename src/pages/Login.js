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

      {/* Dekorasi lingkaran background */}
      <div style={circle1} />
      <div style={circle2} />
      <div style={circle3} />

      <div style={wrapStyle}>
        {/* Label atas kartu */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <span style={versionBadge}>SIMAKARTI · RT 03 RW 03</span>
        </div>

        {/* Kartu Login */}
        <form onSubmit={handleLogin} style={cardStyle}>

          {/* Logo & Judul */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={logoWrap}>🏘️</div>
            <h1 style={titleStyle}>SIMAKARTI</h1>
            <p style={subtitleStyle}>Sistem Informasi Manajemen Kas RT Tiga</p>
          </div>

          {/* Error */}
          {error && <div style={errorStyle}>{error}</div>}

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
          <div style={{ marginBottom: '26px' }}>
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
                title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </span>
            </div>
          </div>

          {/* Tombol */}
          <button type="submit" style={btnStyle}
            onMouseEnter={e => e.currentTarget.style.background = '#0e6b64'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f766e'}
          >
            Masuk Sekarang
          </button>

          {/* Credit */}
          <div style={creditWrap}>
            <div style={dividerLine} />
            <p style={creditStyle}>
              © 2025 Developed by{' '}
              <span style={creditName}>FSL-25</span>
            </p>
            <p style={creditSub}>SIMAKARTI v1.0 · All rights reserved</p>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── STYLES ── */

// Background teal solid + dekorasi
const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  background: '#0f766e',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
};

// Lingkaran dekoratif
const circle1 = {
  position: 'absolute', width: '320px', height: '320px',
  borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
  top: '-80px', left: '-80px', pointerEvents: 'none',
};
const circle2 = {
  position: 'absolute', width: '250px', height: '250px',
  borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
  bottom: '-60px', right: '-60px', pointerEvents: 'none',
};
const circle3 = {
  position: 'absolute', width: '150px', height: '150px',
  borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
  top: '40%', right: '10%', pointerEvents: 'none',
};

const wrapStyle = {
  width: '100%',
  maxWidth: '400px',
  position: 'relative',
  zIndex: 1,
};

const versionBadge = {
  display: 'inline-block',
  background: 'rgba(255,255,255,0.18)',
  color: 'white',
  fontSize: '11px',
  fontWeight: '700',
  letterSpacing: '1.5px',
  padding: '5px 16px',
  borderRadius: '20px',
  textTransform: 'uppercase',
};

// Kartu biru langit
const cardStyle = {
  background: 'linear-gradient(160deg, #e0f2fe 0%, #bae6fd 100%)',
  padding: '36px 32px 28px',
  borderRadius: '24px',
  boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.6)',
};

const logoWrap = {
  fontSize: '50px',
  marginBottom: '10px',
  display: 'inline-block',
  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
};

const titleStyle = {
  margin: '0 0 4px',
  fontSize: '28px',
  fontWeight: '900',
  color: '#0f766e',
  letterSpacing: '3px',
};

const subtitleStyle = {
  margin: 0,
  fontSize: '12px',
  color: '#0369a1',
  fontWeight: '500',
  letterSpacing: '0.2px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '7px',
  fontSize: '12px',
  fontWeight: '700',
  color: '#0c4a6e',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  border: '1.5px solid #7dd3fc',
  borderRadius: '10px',
  boxSizing: 'border-box',
  fontSize: '14px',
  outline: 'none',
  background: 'rgba(255,255,255,0.75)',
  color: '#0c4a6e',
  transition: 'border 0.2s',
};

const eyeStyle = {
  position: 'absolute',
  right: '13px',
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'pointer',
  fontSize: '18px',
  userSelect: 'none',
};

const btnStyle = {
  width: '100%',
  padding: '14px',
  background: '#0f766e',
  color: 'white',
  border: 'none',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: '800',
  fontSize: '15px',
  letterSpacing: '0.8px',
  boxShadow: '0 4px 16px rgba(15,118,110,0.4)',
  transition: 'background 0.2s',
};

const errorStyle = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '11px 14px',
  borderRadius: '8px',
  marginBottom: '16px',
  fontSize: '13px',
  textAlign: 'center',
  border: '1px solid #fca5a5',
  fontWeight: '500',
};

const creditWrap = {
  marginTop: '24px',
  textAlign: 'center',
};

const dividerLine = {
  height: '1px',
  background: 'linear-gradient(to right, transparent, #7dd3fc, transparent)',
  marginBottom: '14px',
};

const creditStyle = {
  margin: '0 0 4px',
  fontSize: '12px',
  color: '#0369a1',
  fontWeight: '500',
};

const creditName = {
  fontWeight: '800',
  color: '#0f766e',
  letterSpacing: '1px',
  fontSize: '13px',
};

const creditSub = {
  margin: 0,
  fontSize: '10px',
  color: '#7dd3fc',
  letterSpacing: '0.5px',
};

export default Login;
