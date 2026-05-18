import { useEffect, useState } from 'react';
import api from '../../lib/axios'; // <-- Gunakan axios
import { useAuth } from '../../contexts/AuthContext';
import { 
  Users, User, Bell, ChevronDown, Search, Edit, Trash2, 
  ChevronLeft, ChevronRight, Plus, X, Save, Download 
} from 'lucide-react';

// --- TIPE DATA ---
type UserProfile = {
  id: string;
  nama: string;
  username: string;
  email: string;
  role: string;
  status: 'Aktif' | 'Tidak Aktif';
  last_login: string;
};

const DUMMY_STATS = { total: 0, admin: 0, guru: 0, operator: 0 };

export default function AdminPenggunaPage() {
  const { profile } = useAuth();
  
  // State Data Utama
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState(DUMMY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // State Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('Semua Role');
  const [filterStatus, setFilterStatus] = useState('Semua Status'); // Sesuaikan default

  // State Modal Tambah & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    nama: '', username: '', email: '', role: 'Guru', status: 'Aktif'
  });

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/users'); // Tembak API Backend

      if (data && data.length > 0) {
        const mappedData: UserProfile[] = data.map((item: any) => ({
          id: item.id.toString(),
          nama: item.name || 'Tanpa Nama',
          username: item.username || '-',
          email: item.email || '',
          role: item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'Guru',
          status: item.status || 'Aktif',
          last_login: item.last_login ? new Date(item.last_login).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).replace(', ', '\n') : 'Belum pernah login',
        }));

        setUsers(mappedData);
        setFilteredUsers(mappedData);

        // Update Stats
        setStats({
          total: mappedData.length,
          admin: mappedData.filter(u => u.role.toLowerCase() === 'admin').length,
          guru: mappedData.filter(u => u.role.toLowerCase() === 'guru').length,
          operator: mappedData.filter(u => u.role.toLowerCase() === 'operator').length
        });
      } else {
        setUsers([]);
        setFilteredUsers([]);
        setStats(DUMMY_STATS);
      }
    } catch (err) {
      console.error("Gagal memuat pengguna dari database", err);
    } finally {
      setIsLoading(false);
    }
  }

  // --- LOGIKA FILTER AKTIF ---
  useEffect(() => {
    let result = [...users];

    // Filter Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.nama.toLowerCase().includes(lower) || 
        u.username.toLowerCase().includes(lower) || 
        u.email.toLowerCase().includes(lower)
      );
    }

    // Filter Role
    if (filterRole !== 'Semua Role') {
      result = result.filter(u => u.role.toLowerCase() === filterRole.toLowerCase());
    }

    // Filter Status
    if (filterStatus !== 'Semua Status') {
        const statusValue = filterStatus === 'Aktif' ? 'Aktif' : 'Tidak Aktif';
        result = result.filter(u => u.status === statusValue);
    }

    setFilteredUsers(result);
  }, [searchTerm, filterRole, filterStatus, users]);

  // --- BUKA MODAL ---
  const openAddModal = () => {
      setAddForm({ nama: '', username: '', email: '', role: 'Guru', status: 'Aktif' });
      setIsEditMode(false);
      setIsModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
      setAddForm({ 
          nama: user.nama, 
          username: user.username === '-' ? '' : user.username, 
          email: user.email, 
          role: user.role, 
          status: user.status 
      });
      setEditId(user.id);
      setIsEditMode(true);
      setIsModalOpen(true);
  };


  const handleSaveUser = async () => {
    if (!addForm.nama || !addForm.email) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
          await api.put(`/admin/users/${editId}`, addForm);
      } else {
          await api.post('/admin/users', addForm);
          alert("Pengguna berhasil ditambahkan! Password default: password123");
      }
      setIsModalOpen(false);
      fetchUsers(); // Refresh data setelah berhasil
    } catch (error: any) {
      alert("Gagal menyimpan data: " + (error.response?.data?.message || "Kesalahan jaringan"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LOGIKA HAPUS ---
  const handleDelete = async (id: string, nama: string) => {
      if(window.confirm(`Yakin ingin menghapus pengguna ${nama}? Semua data terkait akan ikut terhapus.`)) {
          try {
              await api.delete(`/admin/users/${id}`);
              fetchUsers();
          } catch (error) {
              alert("Gagal menghapus pengguna.");
          }
      }
  };

  // --- LOGIKA EXPORT ---
  const handleExport = () => {
    let csv = "No,Nama,Username,Email,Role,Status,Terakhir Login\n";
    filteredUsers.forEach((u, i) => {
        csv += `${i+1},${u.nama},${u.username},${u.email},${u.role},${u.status},${u.last_login.replace('\n', ' ')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Data_Pengguna.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- HELPER BADGES ---
  const getRoleBadge = (role: string) => {
    if (!role) return null;
    if (role.toLowerCase() === 'admin') return <span className="bg-[#e0e7ff] text-[#3b82f6] border border-[#bfdbfe] px-3 py-1 rounded text-[11px] font-semibold">{role}</span>;
    return <span className="bg-[#fef9c3] text-[#ca8a04] border border-[#fef08a] px-3 py-1 rounded text-[11px] font-semibold">{role}</span>;
  };

  const getStatusBadge = (status: string) => {
    if (!status || status === '') return null; 
    if (status === 'Aktif') return <span className="bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] px-3 py-1 rounded text-[11px] font-semibold">Aktif</span>;
    return <span className="bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] px-3 py-1 rounded text-[11px] font-semibold">Tidak Aktif</span>;
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">

      <div className="px-8 pt-8 space-y-6">

        {/* --- ROW 1: 4 STATS CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <p className="text-[14px] font-bold text-gray-800 mb-4">Total Pengguna</p>
                <div className="flex items-center gap-4">
                    <div className="bg-[#f3f4f6] p-2.5 rounded-full"><Users className="w-7 h-7 text-gray-900" /></div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-bold text-gray-900">{stats.total}</span>
                        <span className="text-[12px] text-gray-500 font-medium">Akun</span>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <p className="text-[14px] font-bold text-gray-800 mb-4">Admin</p>
                <div className="flex items-center gap-4">
                    <div className="bg-[#f3f4f6] p-2.5 rounded-full"><User className="w-7 h-7 text-gray-900 fill-gray-900" /></div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-bold text-gray-900">{stats.admin}</span>
                        <span className="text-[12px] text-gray-500 font-medium">Akun</span>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <p className="text-[14px] font-bold text-gray-800 mb-4">Guru</p>
                <div className="flex items-center gap-4">
                    <div className="bg-[#f3f4f6] p-2.5 rounded-full"><User className="w-7 h-7 text-gray-900 fill-gray-900" /></div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-bold text-gray-900">{stats.guru}</span>
                        <span className="text-[12px] text-gray-500 font-medium">Akun</span>
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]">
                <p className="text-[14px] font-bold text-gray-800 mb-4">Operator</p>
                <div className="flex items-center gap-4">
                    <div className="bg-[#f3f4f6] p-2.5 rounded-full"><User className="w-7 h-7 text-gray-900 fill-gray-900" /></div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[28px] font-bold text-gray-900">{stats.operator}</span>
                        <span className="text-[12px] text-gray-500 font-medium">Akun</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- ROW 2: FILTER & TOMBOL --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5 flex flex-wrap lg:flex-nowrap items-center gap-4">
            
            {/* Input Pencarian */}
            <div className="w-full lg:w-[35%] relative">
                <input 
                    type="text" 
                    placeholder="Cari nama, email, atau username.." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-4 py-2.5 text-[13px] text-gray-700 focus:outline-none focus:border-blue-500"
                />
            </div>

            {/* Dropdown Role */}
            <div className="w-full sm:w-[160px] relative border border-gray-200 rounded-md bg-white">
                <select 
                   value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                   className="w-full bg-transparent text-[13px] text-gray-600 px-4 py-2.5 focus:outline-none appearance-none cursor-pointer"
                >
                    <option>Semua Role</option>
                    <option>Admin</option>
                    <option>Guru</option>
                    <option>Operator</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Dropdown Status */}
            <div className="w-full sm:w-[160px] relative border border-gray-200 rounded-md bg-white">
                <select 
                   value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                   className="w-full bg-transparent text-[13px] text-gray-600 px-4 py-2.5 focus:outline-none appearance-none cursor-pointer"
                >
                    <option>Semua Status</option>
                    <option>Aktif</option>
                    <option>Tidak Aktif</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex-1 hidden xl:block"></div> {/* Spacer */}

            {/* Tombol Aksi */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                   onClick={openAddModal}
                   className="flex-1 sm:flex-none bg-[#4455f0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                    + Tambah Pengguna
                </button>
                <button 
                   onClick={handleExport}
                   className="flex-1 sm:flex-none bg-white border border-[#4455f0] text-[#4455f0] hover:bg-blue-50 px-8 py-2.5 rounded-md text-[12px] font-semibold transition-colors"
                >
                    Export
                </button>
            </div>
        </div>

        {/* --- ROW 3: TABEL DATA --- */}
        <div className="bg-white rounded-t-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.03)] border border-gray-100">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#f8fafc] text-gray-700 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-16">No</th>
                            <th className="px-6 py-4">Nama Guru</th>
                            <th className="px-6 py-4">Username</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Terakhir Login</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-500 font-medium">
                        {isLoading ? (
                            <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Memuat data pengguna dari database...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400">Data pengguna tidak ditemukan</td></tr>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-4 text-gray-600">{user.nama}</td>
                                    <td className="px-6 py-4">{user.username}</td>
                                    <td className="px-6 py-4">
                                        {user.email ? (
                                            <a href={`mailto:${user.email}`} className="text-gray-500 hover:text-blue-500 underline decoration-gray-300 underline-offset-2">
                                                {user.email}
                                            </a>
                                        ) : ''}
                                    </td>
                                    <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                                    <td className="px-6 py-4 whitespace-pre-line leading-snug">{user.last_login}</td>
                                    <td className="px-6 py-4">
                                        {user.nama !== 'Anton' && user.nama !== 'Jeno' ? ( // Pertahankan logic UI original
                                            <div className="flex items-center justify-center gap-3">
                                                <button onClick={() => openEditModal(user)} className="text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Edit className="w-[18px] h-[18px]" />
                                                </button>
                                                <button onClick={() => handleDelete(user.id, user.nama)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-[18px] h-[18px]" />
                                                </button>
                                            </div>
                                        ) : null}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-[#f4f7fc] px-6 py-5 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4 mt-8">
                <span className="text-[14px] text-gray-700 font-bold">
                    Menampilkan 1 - {Math.min(5, filteredUsers.length)} dari {filteredUsers.length} data
                </span>
                <div className="flex items-center gap-1.5">
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled>
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded bg-[#e0e7ff] text-[#4455f0] font-medium text-sm border border-[#c7d2fe]">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-white font-medium text-sm border border-gray-300">2</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-white font-medium text-sm border border-gray-300">3</button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-800 hover:bg-white border border-transparent hover:border-gray-300 rounded">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>

      </div>

      {/* ==============================================
          MODAL TAMBAH & EDIT PENGGUNA
          ============================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 bg-white shrink-0">
                <h3 className="font-bold text-lg text-gray-800">{isEditMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto bg-gray-50/50">
                <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                    <input 
                       type="text" value={addForm.nama} onChange={(e) => setAddForm({...addForm, nama: e.target.value})}
                       placeholder="Contoh: Budi Santoso"
                       className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Username</label>
                    <input 
                       type="text" value={addForm.username} onChange={(e) => setAddForm({...addForm, username: e.target.value})}
                       placeholder="Contoh: budi123"
                       className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                </div>
                <div>
                    <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                    <input 
                       type="email" value={addForm.email} onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                       placeholder="budi@example.com"
                       className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Role</label>
                        <select 
                           value={addForm.role} onChange={(e) => setAddForm({...addForm, role: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="Admin">Admin</option>
                            <option value="Guru">Guru</option>
                            <option value="Operator">Operator</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Status</label>
                        <select 
                           value={addForm.status} onChange={(e) => setAddForm({...addForm, status: e.target.value})}
                           className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="Aktif">Aktif</option>
                            <option value="Tidak Aktif">Tidak Aktif</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-white shrink-0">
                <button 
                   onClick={() => setIsModalOpen(false)} disabled={isSubmitting}
                   className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors"
                >
                    Batal
                </button>
                <button 
                   onClick={handleSaveUser} disabled={isSubmitting}
                   className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#4455f0] hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-colors"
                >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
                </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}