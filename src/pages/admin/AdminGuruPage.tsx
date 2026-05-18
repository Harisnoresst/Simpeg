import { useEffect, useState } from 'react';
import { 
  Users, User, GraduationCap, ChevronDown, 
  Search, Edit, Trash2, ChevronLeft, ChevronRight, Plus, X, Save
} from 'lucide-react';
import api from '../../lib/axios'; // <-- Gunakan axios
import { useAuth } from '../../contexts/AuthContext';

// --- TIPE DATA ---
type GuruProfile = {
  id: number;
  name: string;
  email: string;
  nip: string;
  gender: string;
  subject: string;
  status: 'Aktif' | 'Tidak Aktif';
  phone: string;
  avatar_url: string | null;
};

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

  // State Modal TAMBAH & EDIT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const defaultForm = { id: 0, name: '', email: '', nip: '', gender: '', subject: '', status: 'Aktif', phone: '' };
  const [formData, setFormData] = useState(defaultForm);

  // Load Data Pertama Kali
  useEffect(() => {
    fetchGurus();
  }, []);

  useEffect(() => {
    handleFilter();
  }, [gurus, searchTerm, filterStatus, filterMapel, filterGender]);

  async function fetchGurus() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/gurus');
      setGurus(data);
      updateStats(data);
    } catch (error) {
      console.error("Gagal mengambil data guru dari database", error);
    } finally {
      setIsLoading(false);
    }
  }

  // --- LOGIKA FILTER AKTIF ---
  const handleFilter = () => {
    let result = [...gurus];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(g => 
        (g.name || '').toLowerCase().includes(lowerSearch) ||
        (g.nip || '').includes(searchTerm) ||
        (g.subject || '').toLowerCase().includes(lowerSearch)
      );
    }
    if (filterStatus !== 'Semua status') result = result.filter(g => g.status === filterStatus);
    if (filterMapel !== 'Semua') result = result.filter(g => g.subject === filterMapel);
    if (filterGender !== 'Semua') result = result.filter(g => g.gender === filterGender);

    setFilteredGurus(result);
  };

  const updateStats = (data: GuruProfile[]) => {
    const aktifCount = data.filter(g => g.status === 'Aktif').length;
    const uniqueSubjects = new Set(data.map(g => g.subject).filter(Boolean));
    setStats({ total: data.length, aktif: aktifCount, nonAktif: data.length - aktifCount, mapel: uniqueSubjects.size });
  };

  // --- BUKA MODAL ---
  const openAddModal = () => {
      setFormData(defaultForm);
      setIsEditMode(false);
      setIsModalOpen(true);
  };

  const openEditModal = (guru: GuruProfile) => {
      setFormData({ ...guru });
      setIsEditMode(true);
      setIsModalOpen(true);
  };

  // --- LOGIKA SIMPAN (TAMBAH / EDIT) ---
  const handleSaveGuru = async () => {
    if (!formData.name || !formData.email || !formData.nip || !formData.subject) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
          await api.put(`/admin/gurus/${formData.id}`, formData);
      } else {
          await api.post('/admin/gurus', formData);
          alert("Guru baru berhasil ditambahkan! Password default: password123");
      }
      setIsModalOpen(false);
      fetchGurus(); 
    } catch (error: any) {
      alert("Gagal menyimpan data: " + (error.response?.data?.message || "Cek koneksi database"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIKA DELETE ---
  const handleDelete = async (id: number, name: string) => {
      if(window.confirm(`Apakah Anda yakin ingin menghapus guru bernama ${name}? Semua data absensinya juga akan terhapus.`)) {
          try {
              await api.delete(`/admin/gurus/${id}`);
              fetchGurus(); // Refresh data
          } catch (error: any) {
          }
      }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Aktif') return 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]';
    return 'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]';
  };

  // Dapatkan daftar Mapel unik untuk Dropdown Filter
  const uniqueMapelOptions = Array.from(new Set(gurus.map(g => g.subject).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">
      <div className="px-8 pt-8 space-y-6">

        {/* --- ROW 1: STATS & TOMBOL TAMBAH --- */}
        <div className="flex flex-col xl:flex-row gap-6 items-start">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 w-full">
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Total Guru</p>
                    <div className="flex items-end gap-3">
                        <Users className="w-9 h-9 text-blue-600" />
                        <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-gray-900">{stats.total}</span><span className="text-[11px] text-gray-500 font-medium">Orang</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Guru Aktif</p>
                    <div className="flex items-end gap-3">
                        <User className="w-9 h-9 text-green-500" />
                        <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-gray-900">{stats.aktif}</span><span className="text-[11px] text-gray-500 font-medium">Orang</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Guru Non Aktif</p>
                    <div className="flex items-end gap-3">
                        <User className="w-9 h-9 text-red-400" />
                        <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-gray-900">{stats.nonAktif}</span><span className="text-[11px] text-gray-500 font-medium">Orang</span></div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
                    <p className="text-[13px] font-bold text-gray-800 mb-4">Mata Pelajaran</p>
                    <div className="flex items-end gap-3">
                        <GraduationCap className="w-9 h-9 text-indigo-500" />
                        <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-gray-900">{stats.mapel}</span><span className="text-[11px] text-gray-500 font-medium">Jenis</span></div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <button onClick={openAddModal} className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 shadow-sm transition-all hover:shadow-md">
                    <Plus className="w-4 h-4" /> Tambah Guru
                </button>
            </div>
        </div>

        {/* --- ROW 2: FILTER & PENCARIAN --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] border border-gray-100 p-5 flex flex-wrap lg:flex-nowrap items-center gap-4">
            <div className="w-full lg:w-[35%] relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                    type="text" placeholder="Cari nama, NIP, atau mata pelajaran.." 
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
            </div>
            
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500 transition-colors">Status</span>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua status</option><option>Aktif</option><option>Tidak Aktif</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500 transition-colors">Mata Pelajaran</span>
                <select value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)} className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option value="Semua">Semua Mapel</option>
                    {uniqueMapelOptions.map((mapel: any) => <option key={mapel} value={mapel}>{mapel}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500 transition-colors">Jenis Kelamin</span>
                <select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option value="Semua">Semua Gender</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
            </div>
        </div>

        {/* --- ROW 3: TABEL DATA GURU --- */}
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
                            <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">loading data guru nya euyy...</td></tr>
                        ) : filteredGurus.length === 0 ? (
                            <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Data guru tidak ditemukan</td></tr>
                        ) : (
                            filteredGurus.map((guru, index) => (
                                <tr key={guru.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-4">
                                        {guru.avatar_url ? (
                                            <img src={guru.avatar_url} alt={guru.name} className="w-8 h-8 rounded-md object-cover shadow-sm" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 font-bold">{guru.name.charAt(0)}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-800 font-bold">{guru.name} <br/><span className="text-[10px] text-gray-400 font-normal">{guru.email}</span></td>
                                    <td className="px-6 py-4">{guru.nip || '-'}</td>
                                    <td className="px-6 py-4">{guru.gender || '-'}</td>
                                    <td className="px-6 py-4">{guru.subject || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-[11px] font-bold w-[80px] ${getStatusStyle(guru.status)}`}>
                                            {guru.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{guru.phone || '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <button onClick={() => openEditModal(guru)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(guru.id, guru.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-[#f4f7fc] px-6 py-5 flex items-center justify-between border-t border-gray-100">
                <span className="text-[13px] text-gray-600 font-bold">Total {filteredGurus.length} data</span>
            </div>
        </div>
      </div>

      {/* ==============================================
          MODAL TAMBAH & EDIT GURU
          ============================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-[550px] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 shrink-0">
                <h3 className="font-bold text-lg text-gray-800">{isEditMode ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Budi Santoso" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Login <span className="text-red-500">*</span></label>
                        <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="budi@gmail.com" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">NIP <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.nip} onChange={(e) => setFormData({...formData, nip: e.target.value})} placeholder="Masukkan NIP" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Kelamin</label>
                        <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white">
                            <option value="">Pilih</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Mata Pelajaran <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="Matematika" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white">
                            <option value="Aktif">Aktif</option><option value="Tidak Aktif">Tidak Aktif</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. Handphone</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="08123456789" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" />
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors">
                    Batal
                </button>
                <button onClick={handleSaveGuru} disabled={isSubmitting} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#2563eb] hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-colors">
                    <Save className="w-4 h-4" /> {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}