import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    // DATA AKUN RESMI RT 03
    const users = [
      { username: 'ketua', password: 'rt03oke', role: 'ketua' },
      { username: 'sekretaris', password: 'sekretaris03', role: 'sekretaris' },
      { username: 'bendahara', password: 'uangrt03', role: 'bendahara' },
      { username: 'humas', password: 'humasrt03', role: 'humas' },
      { username: 'warga', password: 'warga03', role: 'warga' },
      // Akun Dawis
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
      setError('Username atau Password salah! Cek kembali ejaan Anda.');
    }
  };

  return (
    <div style={containerStyle}>
      <form onSubmit={handleLogin} style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>SIMAKARTI 03</h2>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>Silakan login pengurus/warga</p>
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={{ marginBottom: '15px' }}>
          <label style={labelStyle}>Username</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            style={inputStyle}
            placeholder="Contoh: bendahara"
            required 
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={inputStyle}
            placeholder="Masukkan password"
            required 
          />
        </div>

        <button type="submit" style={buttonStyle}>Masuk ke Sistem</button>
        
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#bdc3c7', textAlign: 'center' }}>
          RT 03 RW 01 - Manajemen Digital
        </div>
      </form>
    </div>
  );
};

// --- STYLING ---
const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ecf0f1' };
const cardStyle = { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '100%', maxWidth: '350px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#34495e' };
const inputStyle = { width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' };
const errorStyle = { background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '13px', textAlign: 'center', border: '1px solid #f5c6cb' };

export default Login;
