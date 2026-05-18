import { useEffect, useState, useRef } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Bell, Camera, LogIn, FileText, 
  CheckSquare, Users, LogOut, Loader2 
} from 'lucide-react';

const DUMMY_PROFILE = {
  nama: 'Memuat...', nip: 'Memuat...', email: 'Memuat...', phone: 'Memuat...',
  jabatan: 'Memuat...', instansi: 'Memuat...', alamat: 'Memuat...', avatar_url: ''
};

const DUMMY_SESSION = { lastLogin: '-', ip: '-', browser: '-', device: '-', status: 'Aktif' };

export default function AdminProfilePage() {
  const { profile } = useAuth();
  
  // State
  const [view, setView] = useState<'overview' | 'edit'>('overview');
  const [data, setData] = useState(DUMMY_PROFILE);
  const [formData, setFormData] = useState(DUMMY_PROFILE);
  const [activities, setActivities] = useState<any[]>([]);
  const [sessionInfo, setSessionInfo] = useState(DUMMY_SESSION);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AMBIL DATA DARI DATABASE ---
  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const response = await api.get('/admin/profile');
        const dbData = response.data;
        
        const loadedData = {
          nama: dbData.profile.nama || '',
          nip: dbData.profile.nip || '',
          email: dbData.profile.email || '',
          phone: dbData.profile.phone || '',
          jabatan: dbData.profile.jabatan || '',
          instansi: dbData.profile.instansi || '',
          alamat: dbData.profile.alamat || '',
          avatar_url: dbData.profile.avatar_url || '' 
        };
        
        setData(loadedData);
        setFormData(loadedData);
        setSessionInfo(dbData.session);
        setActivities(dbData.activities);

      } catch (err) {
        console.error("Gagal menarik data profil.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [profile]);

  // --- HANDLER UBAH FORM (Dijamin tidak hilang fokus) ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- SIMPAN PROFIL KE DATABASE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put('/admin/profile', formData);
      setData(formData); 
      setView('overview'); 
    } catch (err: any) {
      alert("Gagal menyimpan profil: " + (err.response?.data?.message || err.message));
      setFormData(data); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(data); 
  };

  // --- LOGIKA UBAH FOTO PROFIL ---
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar (JPG/PNG).');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal 2MB.');
        return;
    }

    setIsUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('avatar', file);

    try {
        const response = await api.post('/admin/update-avatar', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        const newAvatarUrl = response.data.avatar_url;
        setData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
        setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }));
    } catch (err) {
        alert('Gagal mengupload foto. Coba lagi.');
    } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const getActivityIcon = (type: string) => {
      switch(type) {
          case 'login': return <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0"><LogIn className="w-4 h-4" /></div>;
          case 'report': return <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><FileText className="w-4 h-4" /></div>;
          case 'validate': return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><CheckSquare className="w-4 h-4" /></div>;
          case 'manage': return <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0"><Users className="w-4 h-4" /></div>;
          case 'logout': return <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0"><LogOut className="w-4 h-4" /></div>;
          default: return <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0"><CheckSquare className="w-4 h-4" /></div>;
      }
  };

  const avatarImage = data.avatar_url || 'https://i.pravatar.cc/150?img=11';

  // ==========================================
  // VIEW: UBAH PROFIL (EDIT MODE)
  // ==========================================
  if (view === 'edit') {
      return (
        <div className="min-h-screen bg-[#f4f7fc] font-sans pb-12">
            <div className="bg-white border-b border-gray-200 px-8 py-2 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('overview')} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-800" /></button>
                    <h1 className="text-[15px] font-bold text-gray-900">Ubah Profil</h1>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto px-8 flex flex-col md:flex-row gap-12 items-start">
                
                {/* Kiri: Foto */}
                <div className="w-full md:w-[30%] flex flex-col items-center shrink-0">
                    <div className="w-[200px] h-[200px] rounded-full overflow-hidden shadow-sm mb-6 border-4 border-white bg-white flex items-center justify-center relative">
                        <img src={avatarImage} alt="Foto Profil" className="w-full h-full object-cover"/>
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                                <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                            </div>
                        )}
                    </div>

                    <input 
                       type="file" 
                       ref={fileInputRef} 
                       onChange={handlePhotoChange} 
                       accept="image/png, image/jpeg, image/jpg" 
                       className="hidden" 
                    />
                    
                    <button 
                       onClick={handlePhotoClick} 
                       disabled={isUploading}
                       className="w-full max-w-[200px] bg-[#4455f0] hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-md text-[13px] font-semibold transition-colors shadow-sm"
                    >
                        {isUploading ? 'Mengunggah...' : 'Ubah Foto'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-3 text-center">Format: JPG, PNG. Maks: 2MB.</p>
                </div>

                {/* Kanan: Form Edit (Dibongkar agar kursor tidak hilang) */}
                <div className="w-full md:w-[70%] bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8">
                    <h2 className="text-[#1e3a8a] font-bold text-[15px] mb-6">Ubah Profil</h2>
                    <form onSubmit={e => e.preventDefault()}>
                        
                        <div className="mb-4">
                          <label className="block text-[12px] text-gray-600 mb-1.5">NIP / Username</label>
                          <input type="text" name="nip" value={formData.nip} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors" />
                        </div>

                        <div className="mb-4">
                          <label className="block text-[12px] text-gray-600 mb-1.5">Nama Lengkap</label>
                          <input type="text" name="nama" value={formData.nama} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors" />
                        </div>

                        <div className="mb-4">
                          <label className="block text-[12px] text-gray-600 mb-1.5">Email</label>
                          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors" />
                        </div>

                        <div className="mb-4">
                          <label className="block text-[12px] text-gray-600 mb-1.5">No. HP</label>
                          <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors" />
                        </div>

                        <div className="mb-4">
                          <label className="block text-[12px] text-gray-600 mb-1.5">Alamat</label>
                          <input type="text" name="alamat" value={formData.alamat} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors" />
                        </div>

                        <div className="mb-4">
                          <label className="block text-[12px] text-gray-600 mb-1.5">Instansi</label>
                          <input type="text" name="instansi" value={formData.instansi} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors" />
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <button onClick={handleSave} disabled={isSaving} className="bg-[#4455f0] hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-2.5 rounded text-[13px] font-semibold transition-colors">
                                {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button onClick={handleReset} disabled={isSaving} className="bg-[#6b7280] hover:bg-gray-600 disabled:opacity-50 text-white px-8 py-2.5 rounded text-[13px] font-semibold transition-colors">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-12">
      <div className="max-w-[1200px] pt-8 mx-auto px-8">
        
        {/* TOP SECTION: KARTU INFO PROFIL */}
        <div className="flex flex-col md:flex-row gap-6 items-start mb-8 relative">
            <div className="relative w-28 h-28 shrink-0 mt-4">
                <img src={avatarImage} alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm" />
                <div onClick={() => setView('edit')} className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-[#1e3a8a] cursor-pointer hover:bg-gray-50 transition-colors">
                    <Camera className="w-4 h-4" />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6 flex-1 w-full">
                <h3 className="text-[#1e3a8a] font-bold text-[14px] mb-4">Informasi pribadi</h3>
                
                <div className="mb-4">
                  <label className="block text-[12px] text-gray-500 mb-1.5">Nama lengkap</label>
                  <input type="text" value={data.nama} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                </div>
                
                <div className="mb-4">
                  <label className="block text-[12px] text-gray-500 mb-1.5">NIP/Username</label>
                  <input type="text" value={data.nip} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                </div>

                <div className="mb-4">
                  <label className="block text-[12px] text-gray-500 mb-1.5">Email</label>
                  <input type="text" value={data.email} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                </div>

                <div className="mb-4">
                  <label className="block text-[12px] text-gray-500 mb-1.5">No. Hp</label>
                  <input type="text" value={data.phone} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                </div>

            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6 flex-1 w-full h-full flex flex-col">
                <div className="flex-1 mt-8">
                    <div className="mb-4">
                      <label className="block text-[12px] text-gray-500 mb-1.5">Jabatan (Role)</label>
                      <input type="text" value={data.jabatan} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                    </div>

                    <div className="mb-4">
                      <label className="block text-[12px] text-gray-500 mb-1.5">Instansi</label>
                      <input type="text" value={data.instansi} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                    </div>

                    <div className="mb-4">
                      <label className="block text-[12px] text-gray-500 mb-1.5">Alamat</label>
                      <input type="text" value={data.alamat} readOnly className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none" />
                    </div>
                </div>
                <div className="mt-4 flex justify-end">
                    <button onClick={() => setView('edit')} className="w-full sm:w-auto bg-[#4455f0] hover:bg-blue-700 text-white px-10 py-2.5 rounded text-[13px] font-semibold transition-colors">
                        Edit Profil
                    </button>
                </div>
            </div>
        </div>

        {/* BOTTOM SECTION: AKTIVITAS & SESI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 text-[14px] mb-6">Aktivitas Terakhir</h3>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-[12px] text-gray-500">Belum ada aktivitas tercatat.</p>
                    ) : (
                        activities.map((act, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {getActivityIcon(act.type)}
                                    <span className="text-[12px] font-bold text-gray-700">{act.text}</span>
                                </div>
                                <span className="text-[11px] font-bold text-gray-400">{act.time}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 text-[14px] mb-6">Informasi Sesi</h3>
                <div className="flex flex-col gap-0 divide-y divide-gray-100 text-[12px]">
                    <div className="flex justify-between py-3"><span className="font-bold text-gray-600">Login Terakhir</span><span className="text-gray-500 font-medium">{sessionInfo.lastLogin}</span></div>
                    <div className="flex justify-between py-3"><span className="font-bold text-gray-600">IP Address</span><span className="text-gray-500 font-medium">{sessionInfo.ip}</span></div>
                    <div className="flex justify-between py-3"><span className="font-bold text-gray-600">Browser</span><span className="text-gray-500 font-medium">{sessionInfo.browser}</span></div>
                    <div className="flex justify-between py-3"><span className="font-bold text-gray-600">Perangkat</span><span className="text-gray-500 font-medium">{sessionInfo.device}</span></div>
                    <div className="flex justify-between py-3 items-center"><span className="font-bold text-gray-600">Status Sesi</span><span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded text-[10px] font-bold">{sessionInfo.status}</span></div>
                </div>
            </div>
        </div>

        <div className="bg-gray-100 text-gray-600 text-[12px] p-3 rounded-md font-medium border border-gray-200">
            Pastikan informasi profil Anda selalu diperbarui untuk data yang Akurat.
        </div>
      </div>
    </div>
  );
}