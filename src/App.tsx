import { useState, useEffect } from 'react'; // <-- PASTIKAN useEffect DI-IMPORT
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/SignUpPage'; // Pastikan Anda sudah membuat komponen ini
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardGuru from './pages/guru/DashboardGuru';
import AbsensiPage from './pages/guru/AbsensiPage';
import RiwayatPage from './pages/guru/RiwayatPage';
import IzinCutiPage from './pages/guru/IzinCutiPage';
import ProfilPage from './pages/guru/ProfilPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGuruPage from './pages/admin/AdminGuruPage';
import AdminAbsensiPage from './pages/admin/AdminAbsensiPage';
import AdminSekolahPage from './pages/admin/AdminSekolahPage';
import AdminValidasiAbsensi from './pages/admin/AdminValidasiAbsensi';
import AdminIzinPage from './pages/admin/AdminIzinPage';
import AdminLaporanPage from './pages/admin/AdminLaporanPage';
import AdminUserPage from './pages/admin/AdminUserPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';

type Page =
  | 'dashboard'
  | 'absensi'
  | 'riwayat'
  | 'izin-cuti'
  | 'profil'
  | 'admin-dashboard'
  | 'admin-guru'
  | 'admin-absensi'
  | 'admin-izin'
  | 'admin-laporan'
  | 'admin-profile'
  | 'admin-pengguna'
  | 'admin-pengaturan'
  | 'admin-validasi'
  | 'logout'
  | 'admin-sekolah';

const PAGE_TITLES: Record<Page, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Selamat datang di SIMPEG Absensi Guru' },
  absensi: { title: 'Absensi', subtitle: 'Lakukan absensi masuk dan pulang' },
  riwayat: { title: 'Riwayat Absensi', subtitle: 'Rekap kehadiran Anda' },
  'izin-cuti': { title: 'Izin & Cuti', subtitle: 'Pengajuan izin, sakit, dan cuti' },
  profil: { title: 'Profil Saya', subtitle: 'Kelola data diri Anda' },
  'admin-dashboard': { title: 'Dashboard Admin', subtitle: 'Ringkasan kehadiran hari ini' },
  'admin-guru': { title: 'Data Guru', subtitle: 'Kelola data guru dan staf' },
  'admin-absensi': { title: 'Absensi Guru', subtitle: 'Rekap kehadiran seluruh guru' },
  'admin-izin': { title: 'Izin & Cuti', subtitle: 'Kelola permohonan izin, sakit, cuti' },
  'admin-laporan': { title: 'Laporan', subtitle: 'Laporan dan statistik kehadiran' },
  'admin-sekolah': { title: 'Pengaturan Sekolah', subtitle: 'Kelola data dan lokasi sekolah' },
  'admin-profile': { title: 'Profil Admin', subtitle: 'Kelola data diri Anda' },
  'admin-pengguna': { title: 'Pengguna', subtitle: 'Kelola akun pengguna sistem' },
  'admin-pengaturan': { title: 'Pengaturan', subtitle: 'Konfigurasi sistem dan preferensi' },
  'admin-validasi': { title: 'Validasi Absensi', subtitle: 'Validasi absensi yang memerlukan konfirmasi' },
  logout: { title: 'Logout', subtitle: 'Anda telah keluar dari akun Anda' },
};

function AppContent() {
  const { user, profile, loading } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [currentPage, setCurrentPage] = useState<Page>(isAdmin ? 'admin-dashboard' : 'dashboard');
  
  // STATE BARU: Untuk mengatur halaman sebelum login (Login vs Register)
  const [authPage, setAuthPage] = useState<'login' | 'register'>('login');

  // ======================================================================
  // 🌟 LOGIKA BARU: Otomatis arahkan ke Dashboard setelah berhasil login
  // ======================================================================
  useEffect(() => {
    if (profile) {
      // Jika profile terdeteksi (artinya user baru saja login),
      // Set halaman ke dashboard yang sesuai dengan role-nya
      setCurrentPage(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    }
  }, [profile]);
  // ======================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  // LOGIKA BARU: Jika belum login, tampilkan halaman sesuai state authPage
  if (!user || !profile) {
    if (authPage === 'register') {
      return <RegisterPage onNavigate={setAuthPage} />;
    }
    return <LoginPage onNavigate={setAuthPage} />;
  }

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const pageInfo = PAGE_TITLES[currentPage] || { title: 'SIMPEG' };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="flex-1 flex flex-col min-w-0">
        
        <Header 
           title={pageInfo.title} 
           subtitle={pageInfo.subtitle} 
           onNavigate={(page) => handleNavigate(page as Page)} 
        />

        <main className="flex-1 overflow-auto">
          {!isAdmin && (
            <>
              {currentPage === 'dashboard' && <DashboardGuru onNavigate={handleNavigate as (page: 'absensi' | 'riwayat' | 'izin-cuti') => void} />}
              {currentPage === 'absensi' && <AbsensiPage />}
              {currentPage === 'riwayat' && <RiwayatPage />}
              {currentPage === 'izin-cuti' && <IzinCutiPage />}
              {currentPage === 'profil' && <ProfilPage />}
            </>
          )}
          {isAdmin && (
            <>
              {currentPage === 'admin-dashboard' && <AdminDashboard />}
              {currentPage === 'admin-guru' && <AdminGuruPage />}
              {currentPage === 'admin-absensi' && <AdminAbsensiPage />}
              {currentPage === 'admin-izin' && <AdminIzinPage />}
              {currentPage === 'admin-validasi' && <AdminValidasiAbsensi />}
              {currentPage === 'admin-laporan' && <AdminLaporanPage />}
              {currentPage === 'admin-sekolah' && <AdminSekolahPage />}
              {currentPage === 'admin-pengguna' && <AdminUserPage />}
              {currentPage === 'admin-pengaturan' && <AdminSettingsPage />}
              {currentPage === 'admin-profile' && <AdminProfilePage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}