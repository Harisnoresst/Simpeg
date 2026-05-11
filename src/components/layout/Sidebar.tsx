import { BookOpen, LayoutDashboard, ClipboardCheck, History, FileText, User, LogOut, Users, BarChart2, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
  | 'admin-sekolah';

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const guruMenu = [
    { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'absensi' as Page, label: 'Absensi', icon: ClipboardCheck },
    { id: 'riwayat' as Page, label: 'Riwayat Absen', icon: History },
    { id: 'izin-cuti' as Page, label: 'Izin & Cuti', icon: FileText },
    { id: 'profil' as Page, label: 'Profil', icon: User },
  ];

  const adminMenu = [
    { id: 'admin-dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin-guru' as Page, label: 'Data Guru', icon: Users },
    { id: 'admin-absensi' as Page, label: 'Absensi', icon: ClipboardCheck },
    { id: 'admin-izin' as Page, label: 'Izin & Cuti', icon: FileText },
    { id: 'admin-laporan' as Page, label: 'Laporan', icon: BarChart2 },
    { id: 'admin-sekolah' as Page, label: 'Pengaturan', icon: Settings },
  ];

  const menu = isAdmin ? adminMenu : guruMenu;

  return (
    <aside className="w-56 bg-blue-900 text-white flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-blue-800">
        <div className="bg-white rounded-lg p-1.5">
          <BookOpen className="w-5 h-5 text-blue-900" />
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">SIMPEG</p>
          <p className="text-blue-300 text-xs">Absensi Guru</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {menu.map(item => {
          const Icon = item.icon;
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                active
                  ? 'bg-white text-blue-900 font-semibold shadow'
                  : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-blue-800 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs text-blue-300 capitalize">{profile?.role || 'guru'}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-blue-200 hover:bg-red-600 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
