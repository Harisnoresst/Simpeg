import { useState, useRef, useEffect } from 'react';
import { 
  Bell, User, Settings, LogOut, 
  Check, Clock
} from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';

type Props = {
  title: string;
  subtitle?: string;
  onNavigate?: (page: string) => void;
};

// Tipe data notifikasi dari database
type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  is_read: boolean;
};

export default function Header({ title, subtitle, onNavigate }: Props) {
  const { profile, signOut } = useAuth();
  
  const isAdmin = profile?.role === 'admin';

  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const [logoutState, setLogoutState] = useState<'idle' | 'confirm' | 'success'>('idle');

  const headerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!profile) return;
    try {
      const response = await api.get('/notifications');
      setNotifs(response.data.data);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Gagal mengambil notifikasi", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [profile]);

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


  const handleNotifClick = async () => {
  setShowNotif(!showNotif);
  setShowProfile(false);

  if (!showNotif && unreadCount > 0) {
    try {
      await api.post('/notifications/mark-read');
      setUnreadCount(0); 
    } catch (error) {
      console.error("Gagal menandai notifikasi dibaca:", error);
    }
  }
};

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
          
          {/* NOTIFIKASI LONCENG */}
          <div className="relative">
            <button 
              onClick={handleNotifClick}
              className={`relative p-2 rounded-full transition-colors ${showNotif ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <Bell className="w-5 h-5" />
              {/* Titik merah jika ada unread */}
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            
            {showNotif && (
              <div className="absolute right-0 mt-2 w-[320px] bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b bg-gray-50/50 font-bold text-sm flex justify-between items-center">
                    Notifikasi
                    {unreadCount > 0 && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{unreadCount} Baru</span>}
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifs.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">Tidak ada notifikasi</div>
                    ) : (
                        notifs.map((notif) => (
                          <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}>
                             <div className="flex justify-between items-start mb-1">
                                <h4 className={`text-[13px] ${!notif.is_read ? 'font-bold text-gray-800' : 'font-semibold text-gray-700'}`}>{notif.title}</h4>
                                <span className="text-[10px] text-gray-400 shrink-0 ml-2">{notif.time}</span>
                             </div>
                             <p className="text-[11px] text-gray-500 leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                    )}
                  </div>
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
                {/* Menggunakan profile.name agar sinkron dengan database */}
                <p className="text-[13px] font-bold text-gray-800 leading-tight">{profile?.name || 'User'}</p>
                <p className="text-[11px] text-gray-500 capitalize">{profile?.role || 'Guru'}</p>
              </div>
              
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden border border-gray-100">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  profile?.name?.[0]?.toUpperCase() || 'U'
                )}
              </div>
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

      {/* MODAL LOGOUT */}
      {logoutState === 'confirm' && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[380px] p-8 text-center animate-in fade-in zoom-in duration-200">
            <div className="mx-auto w-16 h-16 border-2 border-[#ef4444] rounded-2xl flex items-center justify-center mb-5"><LogOut className="w-8 h-8 text-[#ef4444] ml-1" /></div>
            <h3 className="text-[18px] font-bold text-gray-900 mb-3">Yakin ingin Logout?</h3>
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">Anda akan keluar dari sistem SIMPEG.<br/>Pastikan tidak ada data penting<br/>yang belum tersimpan</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setLogoutState('idle')} className="px-6 py-2.5 bg-[#6b7280] hover:bg-gray-600 text-white text-sm font-semibold rounded-lg transition-colors">Batal</button>
              <button onClick={() => setLogoutState('success')} className="px-6 py-2.5 bg-[#ef4444] hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">Ya, Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* SUKSES LOGOUT */}
      {logoutState === 'success' && (
        <div className="fixed inset-0 bg-white z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="text-center max-w-sm">
            <div className="mx-auto w-24 h-24 rounded-full border-[6px] border-[#22c55e] flex items-center justify-center mb-6"><Check className="w-12 h-12 text-[#22c55e] stroke-[4]" /></div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Anda telah berhasil logout</h3>
            <p className="text-sm text-gray-600 mb-8">Terima kasih telah menggunakan<br/>SIMPEG Absensi Guru</p>
            <button onClick={() => { setLogoutState('idle'); signOut(); }} className="px-10 py-2.5 bg-[#4455f0] hover:bg-blue-700 text-white text-sm font-semibold rounded-md transition-colors shadow-sm">Log in kembali</button>
          </div>
        </div>
      )}
    </>
  );
}