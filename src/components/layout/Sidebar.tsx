import { useState } from 'react';
import {
  BookOpen,
  LayoutDashboard,
  ClipboardCheck,
  History,
  FileText,
  User,
  LogOut,
  Users,
  BarChart2,
  Settings,
  ClipboardList,
  ClipboardPenLine,
  Check, 
  ScrollText,
  UserRound,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../../contexts/AuthContext';
import { Icon } from "@iconify/react";

type Page =
  | 'dashboard'
  | 'absensi'
  | 'riwayat'
  | 'izin-cuti'
  | 'profil'
  | 'logout'
  | 'admin-dashboard'
  | 'admin-guru'
  | 'admin-absensi'
  | 'admin-izin'
  | 'admin-laporan'
  | 'admin-sekolah'
  | 'admin-profile'
  | 'admin-pengguna'
  | 'admin-pengaturan'
  | 'admin-validasi';

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

type MenuItem = {
  id: Page;
  label: string;
  iconType: "lucide" | "iconify";
  icon: any;
};

export default function Sidebar({ currentPage, onNavigate }: Props) {
  const { profile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  
  const [logoutState, setLogoutState] = useState<'idle' | 'confirm' | 'success'>('idle');
  
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const guruMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', iconType: 'iconify', icon: "material-symbols:table-chart-view-outline-rounded" },
    { id: 'absensi', label: 'Absensi', iconType: 'iconify', icon: "charm:notes-cross" },
    { id: 'riwayat', label: 'Riwayat Absen', iconType: 'iconify', icon: "carbon:report" },
    { id: 'izin-cuti', label: 'Izin dan Cuti', iconType: 'lucide', icon: ClipboardPenLine },
    { id: 'profil', label: 'Profil', iconType: 'iconify', icon: "fa7-solid:chalkboard-teacher" },
    { id: 'logout', label: 'Logout', iconType: 'iconify', icon: "icon-park-outline:logout"},
  ];

  const adminMenu: MenuItem[] = [
    { id: 'admin-dashboard', label: 'Dashboard', iconType: 'lucide', icon: LayoutDashboard },
    { id: 'admin-guru', label: 'Data Guru', iconType: 'lucide', icon: ClipboardList },
    { id: 'admin-absensi', label: 'Absensi', iconType: 'iconify', icon: "charm:notes-cross" },
    { id: 'admin-validasi', label: 'Validasi Absensi', iconType: 'lucide', icon: ClipboardCheck },
    { id: 'admin-laporan', label: 'Laporan', iconType: 'lucide', icon: BarChart2 },
    { id: 'admin-izin', label: 'Izin dan Cuti', iconType: 'lucide', icon: FileText },
    { id: 'admin-pengguna', label: 'Pengguna', iconType: 'lucide', icon: UserRound },
    { id: 'admin-pengaturan', label: 'Pengaturan', iconType: 'lucide', icon: Settings },
    { id: 'admin-profile', label: 'Profil', iconType: 'iconify', icon: "fa7-solid:chalkboard-teacher" },
    { id: 'logout', label: 'Logout', iconType: 'iconify', icon: "icon-park-outline:logout" },
  ];

  const menu = isAdmin ? adminMenu : guruMenu;

  return (
    <>
      <aside className={`bg-[#022668] text-white flex flex-col min-h-screen relative z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-64'}`}>

        {/* tombol tutup buka */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-10 bg-white border border-gray-200 text-[#022668] w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 z-50 shadow-md transition-transform"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* HEADER */}
        <div className={`flex items-center py-8 transition-all duration-300 ${isCollapsed ? 'px-0 justify-center flex-col gap-2' : 'px-6 gap-3'}`}>
          <img src="/logo.png" alt="Logo" className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-12 h-12'}`} />
          {!isCollapsed && (
            <div className="leading-tight whitespace-nowrap overflow-hidden">
              <p className="font-bold text-[22px] tracking-wide">SIMPEG</p>
              <p className="text-gray-200 text-[13px]">Absensi Guru</p>
            </div>
          )}
        </div>

       {/* Menu */}
        <nav className={`flex-1 pb-6 space-y-3 overflow-y-auto hide-scrollbar transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-5'}`}>
          {menu.map(item => {
            const active = currentPage === item.id;
            const isLogout = item.id === 'logout';

            return (
              <button
                key={item.id}
                title={isCollapsed ? item.label : undefined} 
                onClick={() => {
                  if (isLogout) {
                    setLogoutState('confirm');
                  } else {
                    onNavigate(item.id);
                  }
                }}
                className={`group flex items-center transition-all duration-200 bg-white shadow-sm rounded-md font-bold overflow-hidden
                  ${isCollapsed ? 'w-full justify-center p-2.5' : 'w-full px-4 py-2.5 gap-4 text-[13px]'}
                  ${isLogout 
                      ? 'text-[#022668] hover:text-red-500 hover:bg-red-50' 
                      : active 
                        ? 'text-[#3b82f6] hover:bg-blue-50' 
                        : 'text-[#022668] hover:text-[#3b82f6] hover:bg-blue-50'
                  }
                `}
              >
                {/* ICON SYSTEM */}
                {item.iconType === "lucide" && (
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200" />
                )}

                {item.iconType === "iconify" && (
                  <Icon icon={item.icon} className="w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200" />
                )}

                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* FOOTER USER */}
        <div className={`border-t border-[#1a3b77] bg-[#011e54] transition-all duration-300 ${isCollapsed ? 'px-2 py-4 flex justify-center' : 'px-5 py-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white shadow-inner shrink-0">
              {profile?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 whitespace-nowrap overflow-hidden">
                <p className="text-[13px] font-bold truncate text-white">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-[11px] text-blue-200 capitalize">
                  {profile?.role || 'guru'}
                </p>
              </div>
            )}
          </div>
        </div>

      </aside>

      {/* pop up logoutnya */}
      {logoutState === 'confirm' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[380px] p-8 text-center animate-in fade-in zoom-in duration-200">
            
            <div className="mx-auto w-16 h-16 border-2 border-[#ef4444] rounded-2xl flex items-center justify-center mb-5">
              <LogOut className="w-8 h-8 text-[#ef4444] ml-1" />
            </div>
            
            <h3 className="text-[18px] font-bold text-gray-900 mb-3">Yakin ingin Logout?</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              Anda akan keluar dari sistem SIMPEG.<br/>
              Pastikan tidak ada data penting<br/>
              yang belum tersimpan
            </p>
            
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setLogoutState('idle')}
                className="px-6 py-2.5 bg-[#6b7280] hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => setLogoutState('success')}
                className="px-6 py-2.5 bg-[#ef4444] hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Ya, Logout
              </button>
            </div>

          </div>
        </div>
      )}

      {/* tamilan kalo berhasil logout */}
      {logoutState === 'success' && (
        <div className="fixed inset-0 bg-white z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="text-center max-w-sm">
            
            <div className="mx-auto w-24 h-24 rounded-full border-[6px] border-[#22c55e] flex items-center justify-center mb-6">
              <Check className="w-12 h-12 text-[#22c55e] stroke-[4]" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Anda telah berhasil logout</h3>
            <p className="text-sm text-gray-600 mb-8">
              Terima kasih telah menggunakan<br/>
              SIMPEG Absensi Guru
            </p>
            
            <button
              onClick={() => {
                setLogoutState('idle');
                signOut(); 
              }}
              className="px-10 py-2.5 bg-[#4455f0] hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm"
            >
              Log in kembali
            </button>
            
          </div>
        </div>
      )}
    </>
  );
}