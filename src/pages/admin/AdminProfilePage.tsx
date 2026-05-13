import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Bell, Camera, LogIn, FileText, 
  CheckSquare, Users, LogOut 
} from 'lucide-react';

// --- DATA DUMMY AWAL (Jika Database Kosong) ---
const DUMMY_PROFILE = {
  nama: 'Admin Dinas',
  nip: 'admin.dinas',
  email: 'admin@dinaspendidikan.go.id',
  phone: '0813',
  jabatan: 'Administrator sistem',
  instansi: 'Dinas pendidikan dan kebudayaan Kab Bandung',
  alamat: 'Jl.burangrang'
};

const DUMMY_ACTIVITY = [
  { id: 1, text: 'Login ke sistem', time: '20 Mei 2026 08:15 WIB', type: 'login' },
  { id: 2, text: 'Melihat laporan absensi', time: '20 Mei 2026 08:20 WIB', type: 'report' },
  { id: 3, text: 'Memvalidasi absensi guru', time: '20 Mei 2026 09:10 WIB', type: 'validate' },
  { id: 4, text: 'Mengelola data guru', time: '20 Mei 2026 09:45 WIB', type: 'manage' },
  { id: 5, text: 'Logout dari sistem', time: '19 Mei 2026 17:05 WIB', type: 'logout' },
];

const DUMMY_SESSION = {
  lastLogin: '20 Mei 2026 08:15 WIB',
  ip: '192.168.1.25',
  browser: 'Google Chrome 124.0.0.0',
  device: 'Windows 11',
  status: 'Aktif'
};

export default function AdminProfilePage() {
  const { profile } = useAuth();
  
  // State Navigasi View
  const [view, setView] = useState<'overview' | 'edit'>('overview');
  
  // State Data
  const [data, setData] = useState(DUMMY_PROFILE);
  const [formData, setFormData] = useState(DUMMY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- AMBIL DATA DARI DATABASE ---
  useEffect(() => {
    async function loadProfile() {
      if (!profile) return;
      setIsLoading(true);
      try {
        const { data: dbData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single();

        if (error) throw error;
        
        if (dbData) {
          const loadedData = {
            nama: dbData.full_name || dbData.nama || DUMMY_PROFILE.nama,
            nip: dbData.nip || dbData.username || DUMMY_PROFILE.nip,
            email: profile.email || dbData.email || DUMMY_PROFILE.email,
            phone: dbData.phone || DUMMY_PROFILE.phone,
            jabatan: dbData.position || dbData.jabatan || DUMMY_PROFILE.jabatan,
            instansi: dbData.agency || dbData.instansi || DUMMY_PROFILE.instansi,
            alamat: dbData.address || dbData.alamat || DUMMY_PROFILE.alamat
          };
          setData(loadedData);
          setFormData(loadedData);
        }
      } catch (err) {
        console.log("Database belum siap, menggunakan data dummy.");
        setData(DUMMY_PROFILE);
        setFormData(DUMMY_PROFILE);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [profile]);

  // --- HANDLER UBAH FORM ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- SIMPAN KE DATABASE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (profile) {
        const { error } = await supabase.from('profiles').update({
          full_name: formData.nama,
          nip: formData.nip,
          phone: formData.phone,
          position: formData.jabatan,
          address: formData.alamat,
          // note: instansi tidak ada di form edit berdasarkan gambar
        }).eq('id', profile.id);
        
        if (error) throw error;
      }
      setData(formData); // Update view state
      alert("Profil berhasil diperbarui!");
      setView('overview'); // Kembali ke halaman utama
    } catch (err) {
      alert("Disimpan secara lokal (Database Auth belum siap).");
      setData(formData);
      setView('overview');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(data); // Kembalikan ke data terakhir yang tersimpan
  };

  // --- KOMPONEN HELPER ---
  const ReadOnlyInput = ({ label, value }: { label: string, value: string }) => (
    <div className="mb-4">
      <label className="block text-[12px] text-gray-500 mb-1.5">{label}</label>
      <input 
        type="text" 
        value={value} 
        readOnly 
        className="w-full border border-gray-200 rounded-md px-3 py-2 text-[13px] text-gray-600 bg-white focus:outline-none"
      />
    </div>
  );

  const EditableInput = ({ label, name, value, type = "text" }: { label: string, name: string, value: string, type?: string }) => (
    <div className="mb-4">
      <label className="block text-[12px] text-gray-600 mb-1.5">{label}</label>
      <input 
        type={type} 
        name={name}
        value={value} 
        onChange={handleChange}
        className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-[#4455f0] transition-colors"
      />
    </div>
  );

  const getActivityIcon = (type: string) => {
      switch(type) {
          case 'login': return <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0"><LogIn className="w-4 h-4" /></div>;
          case 'report': return <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 shrink-0"><FileText className="w-4 h-4" /></div>;
          case 'validate': return <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 shrink-0"><CheckSquare className="w-4 h-4" /></div>;
          case 'manage': return <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 shrink-0"><Users className="w-4 h-4" /></div>;
          case 'logout': return <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-500 shrink-0"><LogOut className="w-4 h-4" /></div>;
          default: return <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 shrink-0"><CheckSquare className="w-4 h-4" /></div>;
      }
  };


  // ==========================================
  // VIEW: UBAH PROFIL (EDIT MODE)
  // ==========================================
  if (view === 'edit') {
      return (
        <div className="min-h-screen bg-[#f4f7fc] font-sans pb-12">
            {/* HEADER */}
            <div className="bg-white border-b border-gray-200 px-8 py-2 flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => setView('overview')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-800" />
                    </button>
                    <h1 className="text-[15px] font-bold text-gray-900">Ubah Profil</h1>
                </div>
            </div>

            <div className="max-w-[1000px] mx-auto px-8 flex flex-col md:flex-row gap-12 items-start">
                
                {/* Kiri: Foto */}
                <div className="w-full md:w-[30%] flex flex-col items-center shrink-0">
                    <div className="w-[200px] h-[200px] rounded-full overflow-hidden shadow-sm mb-6 border-4 border-white bg-white flex items-center justify-center">
                        <img src="/profil.png" alt="Foto Profil" className="w-full h-full object-cover"/>
                    </div>
                    <button className="w-full max-w-[200px] bg-[#4455f0] hover:bg-blue-700 text-white py-2.5 rounded-md text-[13px] font-semibold transition-colors shadow-sm">
                        Ubah Profil
                    </button>
                </div>

                {/* Kanan: Form Edit */}
                <div className="w-full md:w-[70%] bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8">
                    <h2 className="text-[#1e3a8a] font-bold text-[15px] mb-6">Ubah Profil</h2>
                    <form onSubmit={e => e.preventDefault()}>
                        <EditableInput label="NIP" name="nip" value={formData.nip} />
                        <EditableInput label="Nama" name="nama" value={formData.nama} />
                        <EditableInput label="Jabatan" name="jabatan" value={formData.jabatan} />
                        <EditableInput label="Email" name="email" value={formData.email} type="email" />
                        <EditableInput label="No. HP" name="phone" value={formData.phone} />
                        <EditableInput label="Alamat" name="alamat" value={formData.alamat} />

                        <div className="flex items-center gap-3 pt-4">
                            <button onClick={handleSave} disabled={isSaving} className="bg-[#4455f0] hover:bg-blue-700 text-white px-8 py-2.5 rounded text-[13px] font-semibold transition-colors">
                                {isSaving ? 'Menyimpan...' : 'Simpan'}
                            </button>
                            <button onClick={handleReset} disabled={isSaving} className="bg-[#6b7280] hover:bg-gray-600 text-white px-8 py-2.5 rounded text-[13px] font-semibold transition-colors">
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
      );
  }

  // ==========================================
  // VIEW: OVERVIEW (DEFAULT MODE)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-12">
      <div className="max-w-[1200px] pt-8 mx-auto px-8">
        
        {/* TOP SECTION: KARTU INFO PROFIL */}
        <div className="flex flex-col md:flex-row gap-6 items-start mb-8 relative">
            
            {/* Foto Profil */}
            <div className="relative w-28 h-28 shrink-0 mt-4">
                <img src="https://i.pravatar.cc/150?img=11" alt="Profile" className="w-full h-full rounded-full object-cover border-4 border-white shadow-sm" />
                <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-[#1e3a8a] cursor-pointer hover:bg-gray-50">
                    <Camera className="w-4 h-4" />
                </div>
            </div>

            {/* Kartu Informasi Pribadi */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6 flex-1 w-full">
                <h3 className="text-[#1e3a8a] font-bold text-[14px] mb-4">Informasi pribadi</h3>
                <ReadOnlyInput label="Nama lengkap" value={data.nama} />
                <ReadOnlyInput label="NIP/Username" value={data.nip} />
                <ReadOnlyInput label="Email" value={data.email} />
                <ReadOnlyInput label="No. Hp" value={data.phone} />
            </div>

            {/* Kartu Informasi Jabatan */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6 flex-1 w-full h-full flex flex-col">
                <div className="flex-1 mt-8">
                    <ReadOnlyInput label="Jabatan" value={data.jabatan} />
                    <ReadOnlyInput label="Instansi" value={data.instansi} />
                    <ReadOnlyInput label="Alamat" value={data.alamat} />
                </div>
                
                {/* Tombol Edit Profil */}
                <div className="mt-4 flex justify-end">
                    <button 
                       onClick={() => setView('edit')}
                       className="w-full sm:w-auto bg-[#4455f0] hover:bg-blue-700 text-white px-10 py-2.5 rounded text-[13px] font-semibold transition-colors"
                    >
                        Edit Profil
                    </button>
                </div>
            </div>

        </div>

        {/* BOTTOM SECTION: AKTIVITAS & SESI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Aktivitas Terakhir */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 text-[14px] mb-6">Aktivitas Terakhir</h3>
                <div className="space-y-4">
                    {DUMMY_ACTIVITY.map(act => (
                        <div key={act.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {getActivityIcon(act.type)}
                                <span className="text-[12px] font-bold text-gray-700">{act.text}</span>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400">{act.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Informasi Sesi */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-6">
                <h3 className="font-bold text-gray-800 text-[14px] mb-6">Informasi Sesi</h3>
                <div className="flex flex-col gap-0 divide-y divide-gray-100 text-[12px]">
                    <div className="flex justify-between py-3">
                        <span className="font-bold text-gray-600">Login Terakhir</span>
                        <span className="text-gray-500 font-medium">{DUMMY_SESSION.lastLogin}</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="font-bold text-gray-600">IP Address</span>
                        <span className="text-gray-500 font-medium">{DUMMY_SESSION.ip}</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="font-bold text-gray-600">Browser</span>
                        <span className="text-gray-500 font-medium">{DUMMY_SESSION.browser}</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className="font-bold text-gray-600">Perangkat</span>
                        <span className="text-gray-500 font-medium">{DUMMY_SESSION.device}</span>
                    </div>
                    <div className="flex justify-between py-3 items-center">
                        <span className="font-bold text-gray-600">Status Sesi</span>
                        <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded text-[10px] font-bold">
                            {DUMMY_SESSION.status}
                        </span>
                    </div>
                </div>
            </div>

        </div>

        {/* FOOTER INFO */}
        <div className="bg-gray-100 text-gray-600 text-[12px] p-3 rounded-md font-medium border border-gray-200">
            Pastikan informasi profil Anda selalu diperbarui untuk data yang Akurat.
        </div>

      </div>
    </div>
  );
}