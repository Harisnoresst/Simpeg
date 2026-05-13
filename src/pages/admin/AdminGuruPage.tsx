import { useEffect, useState } from 'react';
import { 
  Users, User, GraduationCap, Bell, ChevronDown, 
  Search, Edit, Trash2, ChevronLeft, ChevronRight, Plus, X, Save
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// --- TIPE DATA LOKAL ---
type GuruProfile = {
  id: string;
  full_name: string;
  nip: string;
  gender: string;
  subject: string;
  status: 'Aktif' | 'Tidak Aktif';
  phone: string;
  avatar_url: string | null;
};

// --- DATA DUMMY Awal ---
const DUMMY_GURUS: GuruProfile[] = [
  { id: '1', full_name: 'Jamal', nip: '199723772838', gender: 'Laki laki', subject: 'Informatika', status: 'Aktif', phone: '08131111', avatar_url: 'https://i.pravatar.cc/150?img=11' },
  { id: '2', full_name: 'Jeno', nip: '199611223344', gender: 'Laki laki', subject: 'PKN', status: 'Tidak Aktif', phone: '0812345678', avatar_url: null },
  { id: '3', full_name: 'Karina', nip: '199833445566', gender: 'Perempuan', subject: 'Fisika', status: 'Aktif', phone: '081999888', avatar_url: null },
  { id: '4', full_name: 'Anton', nip: '199577889900', gender: 'Laki laki', subject: 'Indonesia', status: 'Aktif', phone: '0855443322', avatar_url: null },
];

export default function AdminGuruPage() {
  const { profile } = useAuth();
  
  // State Data Utama
  const [gurus, setGurus] = useState<GuruProfile[]>([]);
  const [filteredGurus, setFilteredGurus] = useState<GuruProfile[]>([]);
  const [stats, setStats] = useState({ total: 0, aktif: 0, nonAktif: 0, mapel: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // State Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua status');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [filterGender, setFilterGender] = useState('Semua');

  // State Modal Tambah Guru
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: '', nip: '', gender: '', subject: '', status: 'Aktif', phone: ''
  });

  // Load Data Pertama Kali
  useEffect(() => {
    fetchGurus();
  }, []);

  async function fetchGurus() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'guru')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mappedData: GuruProfile[] = data.map(item => ({
          id: item.id,
          full_name: item.full_name || item.nama || 'Tanpa Nama',
          nip: item.nip || '',
          gender: item.gender || item.jenis_kelamin || '',
          subject: item.subject || item.mata_pelajaran || '',
          status: item.status || 'Aktif',
          phone: item.phone || '',
          avatar_url: item.avatar_url || null,
        }));
        setGurus(mappedData);
        setFilteredGurus(mappedData);
        updateStats(mappedData);
      } else {
        setGurus(DUMMY_GURUS);
        setFilteredGurus(DUMMY_GURUS);
        updateStats(DUMMY_GURUS);
      }
    } catch (error) {
      console.log("Menggunakan Data Dummy");
      setGurus(DUMMY_GURUS);
      setFilteredGurus(DUMMY_GURUS);
      updateStats(DUMMY_GURUS);
    } finally {
      setIsLoading(false);
    }
  }

  // --- LOGIKA FILTER AKTIF ---
  const handleFilter = () => {
    let result = [...gurus];

    // Filter Pencarian (Nama, NIP, Mapel)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.full_name.toLowerCase().includes(lowerSearch) ||
        g.nip.includes(searchTerm) ||
        g.subject.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter Dropdown Status
    if (filterStatus !== 'Semua status') {
      result = result.filter(g => g.status === filterStatus);
    }

    // Filter Dropdown Mapel
    if (filterMapel !== 'Semua') {
      result = result.filter(g => g.subject === filterMapel);
    }

    // Filter Dropdown Gender
    if (filterGender !== 'Semua') {
      result = result.filter(g => g.gender === filterGender);
    }

    setFilteredGurus(result);
  };

  // Otomatis update statistik berdasarkan data keseluruhan (bukan data terfilter)
  const updateStats = (data: GuruProfile[]) => {
    const aktifCount = data.filter(g => g.status === 'Aktif').length;
    const uniqueSubjects = new Set(data.map(g => g.subject).filter(Boolean));
    setStats({
      total: data.length,
      aktif: aktifCount,
      nonAktif: data.length - aktifCount,
      mapel: uniqueSubjects.size
    });
  };

  // --- LOGIKA TAMBAH GURU AKTIF ---
  const handleAddGuru = async () => {
    if (!addForm.full_name || !addForm.nip || !addForm.subject) {
      alert("Harap isi Nama, NIP, dan Mata Pelajaran!");
      return;
    }

    setIsSubmitting(true);
    const newGuru: GuruProfile = {
      id: Math.random().toString(36).substr(2, 9), // ID Dummy sementara
      full_name: addForm.full_name,
      nip: addForm.nip,
      gender: addForm.gender,
      subject: addForm.subject,
      status: addForm.status as 'Aktif' | 'Tidak Aktif',
      phone: addForm.phone,
      avatar_url: null, // Default kosong
    };

    try {
      // Coba masukkan ke database Supabase
      const { error } = await supabase.from('profiles').insert([{
        id: newGuru.id,
        role: 'guru',
        full_name: newGuru.full_name,
        nip: newGuru.nip,
        gender: newGuru.gender,
        subject: newGuru.subject,
        status: newGuru.status,
        phone: newGuru.phone
      }]);
      
      if (error) throw error;
      alert("Guru berhasil ditambahkan ke database!");
    } catch (error) {
      console.log("Disimpan ke state lokal (Dummy Mode)");
    } finally {
      // Update UI Table langsung
      const updatedGurus = [newGuru, ...gurus];
      setGurus(updatedGurus);
      setFilteredGurus(updatedGurus); // Menampilkan data terbaru
      updateStats(updatedGurus);
      
      // Reset & Tutup Modal
      setAddForm({ full_name: '', nip: '', gender: '', subject: '', status: 'Aktif', phone: '' });
      setIsSubmitting(false);
      setIsAddModalOpen(false);
    }
  };

  // --- HELPER WARNA BADGE ---
  const getStatusStyle = (status: string) => {
    if (status === 'Aktif') return 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]';
    return 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]';
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">
      <div className="px-8 pt-8 space-y-6">

        {/* --- ROW 1: STATS & TOMBOL TAMBAH --- */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                {/* Total Guru */}
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Total Guru</p>
                    <div className="flex items-end gap-3">
                        <Users className="w-9 h-9 text-gray-900" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
                            <span className="text-[11px] text-gray-500 font-medium">Orang</span>
                        </div>
                    </div>
                </div>
                {/* Guru Aktif */}
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Guru Aktif</p>
                    <div className="flex items-end gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"></div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900">{stats.aktif}</span>
                            <span className="text-[11px] text-gray-500 font-medium">Orang</span>
                        </div>
                    </div>
                </div>
                {/* Guru Non Aktif */}
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Guru Non Aktif</p>
                    <div className="flex items-end gap-3">
                        <User className="w-9 h-9 text-gray-900 fill-gray-900" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900">{stats.nonAktif}</span>
                            <span className="text-[11px] text-gray-500 font-medium">Orang</span>
                        </div>
                    </div>
                </div>
                {/* Mata Pelajaran */}
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Mata Pelajaran</p>
                    <div className="flex items-end gap-3">
                        <GraduationCap className="w-9 h-9 text-gray-900" />
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900">{stats.mapel}</span>
                            <span className="text-[11px] text-gray-500 font-medium">jenis</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tombol Tambah Guru Buka Modal */}
            <div className="pt-2">
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#3b82f6] hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Guru
                </button>
            </div>
        </div>

        {/* --- ROW 2: FILTER & PENCARIAN --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 flex flex-wrap lg:flex-nowrap items-center gap-4">
            <div className="w-full lg:w-[35%]">
                <input 
                    type="text" placeholder="Cari nama, NIP, atau mata pelajaran.." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-500"
                />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Status</span>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua status</option><option>Aktif</option><option>Tidak Aktif</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Mata Pelajaran</span>
                <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option><option>Informatika</option><option>Matematika</option><option>Fisika</option><option>Indonesia</option><option>PKN</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Jenis Kelamin</span>
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option><option>Laki laki</option><option>Perempuan</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            {/* Tombol Filter Memanggil Fungsi handleFilter */}
            <button onClick={handleFilter} className="w-full sm:w-auto bg-[#3b82f6] hover:bg-blue-700 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold transition-colors">
                Filter
            </button>
        </div>

        {/* --- ROW 3: TABEL DATA GURU (Menggunakan filteredGurus) --- */}
        <div className="bg-white rounded-t-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#f8fafc] text-gray-700 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-16">No</th>
                            <th className="px-6 py-4">Foto</th>
                            <th className="px-6 py-4">Nama Guru</th>
                            <th className="px-6 py-4">NIP</th>
                            <th className="px-6 py-4">Jenis Kelamin</th>
                            <th className="px-6 py-4">Mata Pelajaran</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4">No. HP</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-500 font-medium">
                        {isLoading ? (
                            <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Memuat data guru...</td></tr>
                        ) : filteredGurus.length === 0 ? (
                            <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Data guru tidak ditemukan berdasarkan filter ini</td></tr>
                        ) : (
                            filteredGurus.map((guru, index) => (
                                <tr key={guru.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-5 text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-5">
                                        {guru.avatar_url ? (
                                            <img src={guru.avatar_url} alt={guru.full_name} className="w-8 h-8 rounded-md object-cover" />
                                        ) : null}
                                    </td>
                                    <td className="px-6 py-5 text-gray-800">{guru.full_name}</td>
                                    <td className="px-6 py-5">{guru.nip || '-'}</td>
                                    <td className="px-6 py-5">{guru.gender || '-'}</td>
                                    <td className="px-6 py-5">{guru.subject || '-'}</td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-[11px] font-bold w-[80px] ${getStatusStyle(guru.status)}`}>
                                            {guru.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5">{guru.phone || '-'}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-3">
                                            <button className="text-gray-400 hover:text-gray-600 transition-colors"><Edit className="w-4 h-4" /></button>
                                            <button className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-[#f4f7fc] px-6 py-5 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4 mt-10">
                <span className="text-[13px] text-gray-600 font-bold">
                    Menampilkan 1 - {Math.min(5, filteredGurus.length)} dari {filteredGurus.length} data
                </span>
                <div className="flex items-center gap-1">
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled><ChevronLeft className="w-5 h-5" /></button>
                    <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eef2ff] text-[#3b82f6] font-bold text-sm border border-[#c7d2fe]">1</button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:opacity-50" disabled><ChevronRight className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
      </div>

      {/* ==============================================
          MODAL TAMBAH GURU
          ============================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
                <h3 className="font-bold text-lg text-gray-800">Tambah Data Guru</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                    <input 
                       type="text" value={addForm.full_name} onChange={(e) => setAddForm({...addForm, full_name: e.target.value})}
                       placeholder="Contoh: Budi Santoso"
                       className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                        <input 
                           type="text" value={addForm.nip} onChange={(e) => setAddForm({...addForm, nip: e.target.value})}
                           placeholder="Masukkan NIP"
                           className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                        <select 
                           value={addForm.gender} onChange={(e) => setAddForm({...addForm, gender: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                        >
                            <option value="">Pilih</option>
                            <option value="Laki laki">Laki laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mata Pelajaran <span className="text-red-500">*</span></label>
                        <input 
                           type="text" value={addForm.subject} onChange={(e) => setAddForm({...addForm, subject: e.target.value})}
                           placeholder="Contoh: Matematika"
                           className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                        <select 
                           value={addForm.status} onChange={(e) => setAddForm({...addForm, status: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
                        >
                            <option value="Aktif">Aktif</option>
                            <option value="Tidak Aktif">Tidak Aktif</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Handphone</label>
                    <input 
                       type="tel" value={addForm.phone} onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                       placeholder="Contoh: 08123456789"
                       className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                <button 
                   onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}
                   className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                    Batal
                </button>
                <button 
                   onClick={handleAddGuru} disabled={isSubmitting}
                   className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#2563eb] hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}