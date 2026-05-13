import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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
  mapel?: string;
};

// --- DATA DUMMY (Sesuai Gambar 100%) ---
const DUMMY_DATA: ValidationRecord[] = [
  { id: '1', nama_guru: 'Jamal', tanggal: '04-04-2026', jam: '07.20', jenis_masalah: 'Lokasi Tidak Valid', detail: 'Lokasi diluar radius sekolah', bukti: 'https://i.pravatar.cc/150?img=11', status_validasi: 'Belum divalidasi', mapel: 'Informatika' },
  { id: '2', nama_guru: 'Jeno', tanggal: '', jam: '', jenis_masalah: '', detail: '', bukti: null, status_validasi: '', mapel: 'PKN' },
  { id: '3', nama_guru: 'Karina', tanggal: '', jam: '', jenis_masalah: '', detail: '', bukti: null, status_validasi: '', mapel: 'Fisika' },
  { id: '4', nama_guru: 'Anton', tanggal: '', jam: '', jenis_masalah: '', detail: '', bukti: null, status_validasi: '', mapel: 'Indonesia' },
];

const DUMMY_STATS = {
  perluValidasi: 10,
  lokasiTidakValid: 3,
  fotoTidakValid: 6,
  absenGanda: 2,
  sudahDivalidasi: 10
};

export default function AdminValidasiPage() {
  const { profile } = useAuth();
  
  // State Data
  const [data, setData] = useState<ValidationRecord[]>([]);
  const [filteredData, setFilteredData] = useState<ValidationRecord[]>([]);
  const [stats, setStats] = useState(DUMMY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // State Filter
  const [filterTanggal, setFilterTanggal] = useState('10/04/2026');
  const [filterStatus, setFilterStatus] = useState('Semua Guru'); // Sesuai teks di gambar
  const [filterMasalah, setFilterMasalah] = useState('Semua');
  const [filterMapel, setFilterMapel] = useState('Semua');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      // Simulasi tarik data dari DB (Sesuaikan nama kolom dengan struktur DB Anda)
      const { data: dbData, error } = await supabase
        .from('attendances')
        .select('*, profiles(full_name, subject)')
        .eq('validation_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (dbData && dbData.length > 0) {
        const mapped = dbData.map((item: any) => ({
          id: item.id,
          nama_guru: item.profiles?.full_name || 'Tanpa Nama',
          tanggal: item.date || '',
          jam: item.check_in_time || '',
          jenis_masalah: item.issue_type || 'Lokasi Tidak Valid',
          detail: item.issue_detail || 'Lokasi diluar radius sekolah',
          bukti: item.photo_in || null,
          status_validasi: 'Belum divalidasi',
          mapel: item.profiles?.subject || 'Umum'
        }));
        setData(mapped);
        setFilteredData(mapped);
      } else {
        throw new Error("Data Kosong");
      }
    } catch (err) {
      console.log("Database belum siap/kosong, menggunakan Data Dummy");
      setData(DUMMY_DATA);
      setFilteredData(DUMMY_DATA);
      setStats(DUMMY_STATS);
    } finally {
      setIsLoading(false);
    }
  }

  // --- LOGIKA FILTER ---
  const handleFilter = () => {
    let result = [...data];
    if (filterMasalah !== 'Semua') {
      result = result.filter(item => item.jenis_masalah === filterMasalah);
    }
    if (filterMapel !== 'Semua') {
      result = result.filter(item => item.mapel === filterMapel);
    }
    setFilteredData(result);
  };

  const handleReset = () => {
    setFilterTanggal('10/04/2026');
    setFilterStatus('Semua Guru');
    setFilterMasalah('Semua');
    setFilterMapel('Semua');
    setFilteredData(data);
  };

  // --- LOGIKA AKSI (Setuju / Tolak) ---
  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      // Coba update DB
      await supabase.from('attendances').update({ validation_status: action }).eq('id', id);
    } catch (err) {
      console.log("Dummy Mode: Update status lokal");
    }

    // Update UI Lokal: Ubah status atau hapus dari daftar "Perlu Validasi"
    const updatedData = data.map(item => {
      if (item.id === id) {
         return { ...item, status_validasi: action === 'approved' ? 'Disetujui' : 'Ditolak' };
      }
      return item;
    });
    
    setData(updatedData);
    
    const updatedFiltered = filteredData.map(item => {
        if (item.id === id) {
            return { ...item, status_validasi: action === 'approved' ? 'Disetujui' : 'Ditolak' };
        }
        return item;
    });
    setFilteredData(updatedFiltered);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">
      <div className="px-8 pt-8 space-y-6">

        {/* --- ROW 1: STATS CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Perlu Validasi</p>
                <span className="text-[26px] font-bold text-[#eab308] leading-none mb-1">{stats.perluValidasi}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Lokasi Tidak Valid</p>
                <span className="text-[26px] font-bold text-[#ef4444] leading-none mb-1">{stats.lokasiTidakValid}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Foto tidak Valid</p>
                <span className="text-[26px] font-bold text-[#a855f7] leading-none mb-1">{stats.fotoTidakValid}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Absen Ganda</p>
                <span className="text-[26px] font-bold text-[#3b82f6] leading-none mb-1">{stats.absenGanda}</span>
                <span className="text-[11px] text-gray-400 font-medium">Absensi</span>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col justify-center relative">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Sudah Divalidasi</p>
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-7 h-7 text-[#22c55e]" />
                    <span className="text-[26px] font-bold text-[#22c55e] leading-none">{stats.sudahDivalidasi}</span>
                </div>
                <span className="text-[11px] text-gray-400 font-medium mt-1">Absensi</span>
            </div>
        </div>

        {/* --- ROW 2: FILTER BAR --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] p-5 flex flex-wrap lg:flex-nowrap items-center gap-4">
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Tanggal</span>
                <select value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>10/04/2026</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Status validasi</span>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua Guru</option><option>Belum divalidasi</option><option>Disetujui</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Jenis Masalah</span>
                <select value={filterMasalah} onChange={e => setFilterMasalah(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option><option>Lokasi Tidak Valid</option><option>Foto tidak Valid</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Mata Pelajaran</span>
                <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option><option>Informatika</option><option>PKN</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto mt-1">
                <button onClick={handleFilter} className="bg-[#4455f0] hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-[12px] font-semibold transition-colors">
                    Terapkan Filter
                </button>
                <button onClick={handleReset} className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-md text-[12px] font-semibold transition-colors">
                    Reset
                </button>
            </div>
        </div>

        {/* --- ROW 3: TABEL VALIDASI --- */}
        <div>
            <h3 className="text-[13px] font-bold text-gray-900 mb-3 ml-1">Daftar Absensi Perlu Validasi</h3>
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
                                <tr><td colSpan={9} className="px-6 py-10 text-center">Memuat data...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={9} className="px-6 py-10 text-center">Data tidak ditemukan</td></tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.nama_guru}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.tanggal}</td>
                                        <td className="px-6 py-4 text-gray-500">{item.jam}</td>
                                        <td className="px-6 py-4 text-center">
                                            {item.jenis_masalah && (
                                                <span className="inline-block border border-red-200 bg-red-50 text-red-500 px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap">
                                                    {item.jenis_masalah}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-[11px] text-gray-500">{item.detail}</td>
                                        <td className="px-6 py-4">
                                            {item.bukti && <img src={item.bukti} alt="Bukti" className="w-7 h-7 rounded object-cover" />}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {item.status_validasi && (
                                                <span className={`inline-block px-3 py-1 rounded text-[10px] font-semibold whitespace-nowrap ${
                                                    item.status_validasi === 'Disetujui' ? 'bg-green-100 text-green-700' :
                                                    item.status_validasi === 'Ditolak' ? 'bg-red-100 text-red-700' :
                                                    'bg-[#fef9c3] text-[#ca8a04]' // Belum divalidasi
                                                }`}>
                                                    {item.status_validasi}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.nama_guru && item.status_validasi === 'Belum divalidasi' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleAction(item.id, 'approved')} className="bg-[#dcfce7] hover:bg-green-200 text-[#166534] border border-[#bbf7d0] px-3 py-1 rounded text-[11px] font-bold transition-colors">
                                                        Setuju
                                                    </button>
                                                    <button onClick={() => handleAction(item.id, 'rejected')} className="bg-[#fee2e2] hover:bg-red-200 text-[#991b1b] border border-[#fecaca] px-3 py-1 rounded text-[11px] font-bold transition-colors">
                                                        Tolak
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
                <div className="bg-[#f4f7fc] px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
                    <span className="text-[13px] text-gray-600 font-semibold">
                        Menampilkan 1 - 5 dari 20 data
                    </span>
                    <div className="flex items-center gap-1">
                        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled>
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eef2ff] text-[#3b82f6] font-bold text-sm border border-[#c7d2fe]">1</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-white font-medium text-sm border border-gray-200">2</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-white font-medium text-sm border border-gray-200">3</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-white font-medium text-sm border border-gray-200">4</button>
                        <button className="w-8 h-8 flex items-center justify-center rounded text-gray-600 hover:bg-white font-medium text-sm border border-gray-200">5</button>
                        <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}