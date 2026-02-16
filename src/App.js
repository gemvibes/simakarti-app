import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import semua halaman yang sudah kita buat
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import InputDawis from './pages/InputDawis';
import InputToko from './pages/InputToko';
import InputPengeluaran from './pages/InputPengeluaran';
import Persetujuan from './pages/Persetujuan';
import Sekretaris from './pages/Sekretaris';
import LaporanKas from './pages/LaporanKas';
import Profil from './pages/Profil';

const App = () => {
  return (
    <Router>
      <div className="font-sans text-gray-900 bg-gray-50 min-h-screen">
        <Routes>
          {/* Halaman Login sebagai halaman awal jika belum login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Halaman Utama */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Menu Khusus Pengurus */}
          <Route path="/input-dawis" element={<InputDawis />} />
          <Route path="/input-toko" element={<InputToko />} />
          <Route path="/input-pengeluaran" element={<InputPengeluaran />} />
          <Route path="/persetujuan" element={<Persetujuan />} />
          <Route path="/sekretaris" element={<Sekretaris />} />
          
          {/* Menu Umum */}
          <Route path="/laporan-kas" element={<LaporanKas />} />
          <Route path="/profil" element={<Profil />} />

          {/* Pengalihan Default: Jika buka root '/', lempar ke dashboard (yang nanti akan cek login sendiri) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Halaman 404 jika alamat salah */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
              <h1 className="text-4xl font-bold text-gray-300">404</h1>
              <p className="text-gray-500 mt-2">Halaman tidak ditemukan</p>
              <a href="/dashboard" className="mt-4 text-blue-600 font-bold">Kembali ke Dashboard</a>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;