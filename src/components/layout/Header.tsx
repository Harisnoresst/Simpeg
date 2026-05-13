import { useState, useRef, useEffect } from 'react';
import { 
  Bell, User, Settings, LogOut, 
  Check, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  title: string;
  subtitle?: string;
  onNavigate?: (page: string) => void;
};

const INITIAL_NOTIFS = [
  { id: 1, title: 'Notifikasi Sistem', desc: 'Selamat datang di SIMPEG.', time: 'Baru saja', unread: true },
];

export default function Header({ title, subtitle, onNavigate }: Props) {
  const { profile, signOut } = useAuth();
  
  const isAdmin = profile?.role === 'admin';

  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  
  const [logoutState, setLogoutState] = useState<'idle' | 'confirm' | 'success'>('idle');

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutState !== 'idle') return; 

      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowProfile(false);
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [logoutState]);

  const handleMenuClick = (action: string) => {
    setShowProfile(false);
    if (action === 'logout') {
      setLogoutState('confirm');
    } else if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <>
      <header ref={headerRef} className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between relative z-40">
        
        <div>
          <h1 className="text-[20px] font-bold text-gray-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        
        <div className="flex items-center gap-5 relative">
          
          {/* NOTIFIKASI */}
          <div className="relative">
            <button 
              onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
              className={`relative p-2 rounded-full transition-colors ${showNotif ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Bell className="w-5 h-5" />
            </button>
            {showNotif && (
              <div className="absolute right-0 mt-2 w-[300px] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b bg-gray-50/50 font-bold text-sm">Notifikasi</div>
                  <div className="p-4 text-center text-xs text-gray-400">Tidak ada notifikasi baru</div>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-gray-200"></div>

          {/* PROFIL DROPDOWN */}
          <div className="relative">
            <div 
              onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
              className="flex items-center gap-3 cursor-pointer group p-1.5 pr-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="hidden sm:block text-right">
                <p className="text-[13px] font-bold text-gray-800 leading-tight">{profile?.full_name || 'User'}</p>
                <p className="text-[11px] text-gray-500 capitalize">{profile?.role || 'Guru'}</p>
              </div>
              
              {/* =========================================================
                  BAGIAN FOTO PROFIL (Sudah terhubung ke database)
                  ========================================================= */}
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden border border-gray-100">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Profil" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  profile?.full_name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              {/* ========================================================= */}

            </div>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-[200px] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-1.5">
                  <button 
                    onClick={() => handleMenuClick(isAdmin ? 'admin-profile' : 'profil')} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors"
                  >
                    <User className="w-4 h-4" /> Profil Saya
                  </button>

                  {isAdmin && (
                    <button 
                      onClick={() => handleMenuClick('admin-pengaturan')} 
                      className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors"
                    >
                      <Settings className="w-4 h-4" /> Pengaturan
                    </button>
                  )}
                </div>

                <div className="p-1.5 border-t border-gray-100">
                  <button 
                    onClick={() => handleMenuClick('logout')} 
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* pop out logout */}
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

      {/* tamilan sukses logout */}
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