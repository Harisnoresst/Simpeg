import { useEffect, useState } from 'react';
import api from '../../lib/axios'; 
import { useAuth } from '../../contexts/AuthContext';
import { Bell, ChevronDown, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

// --- TIPE DATA ---
type ValidationRecord = {
  id: string;
  nama_guru: string;
  tanggal: string;
  jam: string;
  jenis_masalah: string;
  detail: string;
  bukti: string | null;
  status_validasi: string;
  mapel: string;
};

export default function AdminValidasiPage() {
  const { profile } = useAuth();
  
  // State Data
  const [data, setData] = useState<ValidationRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ValidationRecord[]>([]);
  const [stats, setStats] = useState({ perluValidasi: 0, lokasiTidakValid: 0, fotoTidakValid: 0, absenGanda: 0, sudahDivalidasi: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // State Filter
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterTanggal, setFilterTanggal] = useState(todayStr); 
  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterMasalah, setFilterMasalah] = useState('Semua');
  const [filterMapel, setFilterMapel] = useState('Semua');

  // Load Data saat Tanggal berubah
  useEffect(() => {
    loadData(filterTanggal);
  }, [filterTanggal]);

  // Efek filter lokal
  useEffect(() => {
    handleFilter();
  }, [data, filterStatus, filterMasalah, filterMapel]);

  async function loadData(date: string) {
    setIsLoading(true);
    try {
      const response = await api.get(`/admin/validations?date=${date}`);
      setData(response.data.data);
      setStats(response.data.stats);
    } catch (err) {
      console.error("Gagal mengambil data validasi:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleFilter = () => {
    let result = [...data];
    
    if (filterStatus !== 'Semua Status') {
      result = result.filter(item => item.status_validasi === filterStatus);
    }
    if (filterMasalah !== 'Semua') {
      result = result.filter(item => item.jenis_masalah.includes(filterMasalah));
    }
    if (filterMapel !== 'Semua') {
      result = result.filter(item => item.mapel === filterMapel);
    }
    setFilteredData(result);
  };

  const handleReset = () => {
    setFilterStatus('Semua Status');
    setFilterMasalah('Semua');
    setFilterMapel('Semua');
  };

  const handleAction = async (id: string, action: 'Disetujui' | 'Ditolak') => {
    try {
      await api.put(`/admin/validations/${id}`, { status_validasi: action });
      
      const updatedData = data.map(item => item.id === id ? { ...item, status_validasi: action } : item);
      setData(updatedData);

      setStats(prev => ({
         ...prev,
         perluValidasi: prev.perluValidasi > 0 ? prev.perluValidasi - 1 : 0,
         sudahDivalidasi: prev.sudahDivalidasi + 1
      }));

    } catch (err: any) {
      alert("Gagal mengupdate status: " + (err.response?.data?.message || "Kesalahan jaringan"));
    }
  };

  const uniqueMapels = Array.from(new Set(data.map(item => item.mapel).filter(Boolean)));

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">
      <div className="px-8 pt-8 space-y-6">

        {/* --- ROW 1: STATS CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center border border-gray-100">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Perlu Validasi</p>
                <span className="text-[26px] font-bold text-[#eab308] leading-none mb-1">{stats.perluValidasi}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center border border-gray-100">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Lokasi Tidak Valid</p>
                <span className="text-[26px] font-bold text-[#ef4444] leading-none mb-1">{stats.lokasiTidakValid}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center border border-gray-100">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Foto tidak Valid</p>
                <span className="text-[26px] font-bold text-[#a855f7] leading-none mb-1">{stats.fotoTidakValid}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center border border-gray-100">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Absen Ganda</p>
                <span className="text-[26px] font-bold text-[#3b82f6] leading-none mb-1">{stats.absenGanda}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center relative border border-gray-100">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Sudah Divalidasi</p>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-[#22c55e]" />
                    <span className="text-[26px] font-bold text-[#22c55e] leading-none">{stats.sudahDivalidasi}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium mt-1">Absensi</span>
            </div>
        </div>

        {/* --- ROW 2: FILTER BAR --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] border border-gray-100 p-5 flex flex-wrap lg:flex-nowrap items-center gap-4">
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Tanggal Validasi</span>
                <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="w-full bg-transparent text-[13px] font-semibold text-gray-700 focus:outline-none cursor-pointer" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Status Validasi</span>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua Status</option>
                    <option>Belum divalidasi</option>
                    <option>Disetujui</option>
                    <option>Ditolak</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Jenis Masalah</span>
                <select value={filterMasalah} onChange={e => setFilterMasalah(e.target.value)} className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option>
                    <option value="Lokasi">Lokasi Tidak Valid</option>
                    <option value="Foto">Foto Tidak Valid</option>
                    <option value="Perlu Verifikasi">Perlu Verifikasi Rutin</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Mata Pelajaran</span>
                <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option value="Semua">Semua Mapel</option>
                    {uniqueMapels.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto mt-1">
                <button onClick={handleReset} className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-[12px] font-bold transition-colors">Reset Filter</button>
            </div>
        </div>

        {/* --- ROW 3: TABEL VALIDASI --- */}
        <div>
            <h3 className="text-[13px] font-bold text-[#1e3a8a] mb-3 ml-1">Daftar Absensi Perlu Validasi</h3>
            <div className="bg-white rounded-t-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100">
                <div className="overflow-x-auto min-h-[350px]">
                    <table className="w-full text-left text-[12px]">
                        <thead className="bg-[#f8fafc] text-gray-700 font-bold border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 w-12">No</th>
                                <th className="px-6 py-4">Nama Guru</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Jam</th>
                                <th className="px-6 py-4 text-center">Jenis Masalah</th>
                                <th className="px-6 py-4">Detail</th>
                                <th className="px-6 py-4">Bukti</th>
                                <th className="px-6 py-4 text-center">Status Validasi</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-gray-500 font-medium">
                            {isLoading ? (
                                <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Menarik data dari database...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Tidak ada data absensi untuk divalidasi</td></tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4 text-gray-800 font-bold">{item.nama_guru} <br/><span className="text-[10px] text-gray-400 font-normal">{item.mapel}</span></td>
                                        <td className="px-6 py-4 text-gray-600">{item.tanggal}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.jam ? item.jam.substring(0,5) : '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.jenis_masalah && (
                                                <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold whitespace-nowrap border ${
                                                    item.jenis_masalah.includes('Lokasi') && !item.jenis_masalah.includes('Foto')
                                                    ? 'border-red-200 bg-red-50 text-red-500' 
                                                    : item.jenis_masalah.includes('Foto') && !item.jenis_masalah.includes('Lokasi')
                                                    ? 'border-purple-200 bg-purple-50 text-purple-600'
                                                    : item.jenis_masalah.includes('&') 
                                                    ? 'border-orange-200 bg-orange-50 text-orange-600' 
                                                    : 'border-blue-200 bg-blue-50 text-blue-500'
                                                }`}>
                                                    {item.jenis_masalah}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[11px] text-gray-500">{item.detail}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center">
                                                {item.bukti ? (
                                                    <a href={item.bukti} target="_blank" rel="noreferrer">
                                                        <img src={item.bukti} alt="Bukti" className="w-8 h-8 rounded-md object-cover shadow-sm hover:opacity-80" />
                                                    </a>
                                                ) : <span className="text-gray-300">-</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded text-[10px] font-bold whitespace-nowrap border ${
                                                item.status_validasi === 'Disetujui' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.status_validasi === 'Ditolak' ? 'bg-red-50 text-red-700 border-red-200' :
                                                'bg-[#fef9c3] text-[#ca8a04] border-yellow-200'
                                            }`}>
                                                {item.status_validasi}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status_validasi === 'Belum divalidasi' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleAction(item.id, 'Disetujui')} className="bg-[#dcfce7] hover:bg-green-200 text-[#166534] border border-[#bbf7d0] px-3 py-1.5 rounded text-[11px] font-bold transition-colors shadow-sm">Setuju</button>
                                                    <button onClick={() => handleAction(item.id, 'Ditolak')} className="bg-[#fee2e2] hover:bg-red-200 text-[#991b1b] border border-[#fecaca] px-3 py-1.5 rounded text-[11px] font-bold transition-colors shadow-sm">Tolak</button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-gray-400 italic block text-center">Selesai</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="bg-[#f4f7fc] px-6 py-5 flex items-center justify-between border-t border-gray-100 mt-4">
                    <span className="text-[13px] text-gray-600 font-bold">Total {filteredData.length} data perlu divalidasi</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}