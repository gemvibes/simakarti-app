import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    const users = [
      { username: 'ketua', password: 'rt03oke', role: 'ketua' },
      { username: 'sekretaris', password: 'sekretaris03', role: 'sekretaris' },
      { username: 'bendahara', password: 'uangrt03', role: 'bendahara' },
      { username: 'humas', password: 'humasrt03', role: 'humas' },
      { username: 'warga', password: 'warga03', role: 'warga' },
      { username: 'dawis1', password: 'dawis03', role: 'dawis1' },
      { username: 'dawis2', password: 'dawis03', role: 'dawis2' },
      { username: 'dawis3', password: 'dawis03', role: 'dawis3' },
      { username: 'dawis4', password: 'dawis03', role: 'dawis4' },
      { username: 'dawis5', password: 'dawis03', role: 'dawis5' },
      { username: 'dawis6', password: 'dawis03', role: 'dawis6' },
    ];

    const foundUser = users.find(
      (u) => u.username === username.toLowerCase() && u.password === password
    );

    if (foundUser) {
      onLogin(foundUser);
    } else {
      setError('Username atau Password salah!');
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={logoIcon}>🏘️</div>
          <h2 style={{ margin: 0, color: '#2c3e50', letterSpacing: '1px' }}>SIMAKARTI 03</h2>
          <p style={{ color: '#7f8c8d', fontSize: '13px', marginTop: '5px' }}>RT 03 RW 03 - Manajemen Digital</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={inputStyle}
            placeholder="Masukkan username"
            required 
          />
        </div>

        <div style={{ marginBottom: '25px', position: 'relative' }}>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={inputStyle}
              placeholder="Masukkan password"
              required 
            />
            <span 
              onClick={() => setShowPassword(!showPassword)} 
              style={eyeIconStyle}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </span>
          </div>
        </div>

        <button type="submit" style={buttonStyle}>Masuk Sekarang</button>
        
        <div style={{ marginTop: '30px', fontSize: '11px', color: '#95a5a6', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          Sistem Informasi Manajemen Administrasi <br/> Keuangan & RT 03 RW 03
        </div>
      </form>
    </div>
  );
};

// --- STYLING (Modern & Clean) ---
const containerStyle = { 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  height: '100vh', 
  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
};

const cardStyle = { 
  background: 'white', 
  padding: '40px', 
  borderRadius: '16px', 
  boxShadow: '0 15px 35px rgba(0,0,0,0.1)', 
  width: '100%', 
  maxWidth: '380px' 
};

const logoIcon = {
  fontSize: '40px',
  marginBottom: '10px'
};

const labelStyle = { 
  display: 'block', 
  marginBottom: '8px', 
  fontSize: '13px', 
  fontWeight: '600', 
  color: '#34495e' 
};

const inputStyle = { 
  width: '100%', 
  padding: '12px 15px', 
  border: '1.5px solid #dfe6e9', 
  borderRadius: '8px', 
  boxSizing: 'border-box',
  fontSize: '15px',
  transition: 'all 0.3s',
  outline: 'none'
};

const eyeIconStyle = {
  position: 'absolute',
  right: '12px',
  top: '50%',
  transform: 'translateY(-50%)',
  cursor: 'pointer',
  fontSize: '18px',
  userSelect: 'none'
};

const buttonStyle = { 
  width: '100%', 
  padding: '14px', 
  background: '#3498db', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  fontSize: '16px',
  boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)',
  transition: 'background 0.3s'
};

const errorStyle = { 
  background: '#fff5f5', 
  color: '#c0392b', 
  padding: '12px', 
  borderRadius: '8px', 
  marginBottom: '20px', 
  fontSize: '13px', 
  textAlign: 'center', 
  border: '1px solid #feb2b2' 
};

export default Login;
