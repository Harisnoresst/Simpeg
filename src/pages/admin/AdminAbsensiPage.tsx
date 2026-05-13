import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, ChevronDown, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

// --- TIPE DATA ---
type AttendanceRecord = {
  id: string;
  nama_guru: string;
  mata_pelajaran: string; // Di gambar tertulis tanggal (04-04-2026), kita ikuti mock-nya
  jenis_absensi: string;
  jam: string;
  lokasi: string;
  jarak: string;
  foto: string | null;
  status: string;
};

// --- DATA DUMMY (Persis Seperti Gambar) ---
const DUMMY_DATA: AttendanceRecord[] = [
  { id: '1', nama_guru: 'Jamal', mata_pelajaran: '04-04-2026', jenis_absensi: 'Masuk', jam: '07.20', lokasi: '-0.1312, 100.1323', jarak: '30 m', foto: 'https://i.pravatar.cc/150?img=11', status: 'Hadir' },
  { id: '2', nama_guru: 'Jeno', mata_pelajaran: '', jenis_absensi: '', jam: '', lokasi: '', jarak: '', foto: null, status: '' },
  { id: '3', nama_guru: 'Karina', mata_pelajaran: '', jenis_absensi: '', jam: '', lokasi: '', jarak: '', foto: null, status: '' },
  { id: '4', nama_guru: 'Anton', mata_pelajaran: '', jenis_absensi: '', jam: '', lokasi: '', jarak: '', foto: null, status: '' },
];

const DUMMY_STATS = { total: 100, hadir: 91, tidakHadir: 6, terlambat: 5, izin: 3 };

export default function AdminAbsensiPage() {
  const { profile } = useAuth();
  
  // State Data
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [filteredData, setFilteredData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState(DUMMY_STATS);
  const [isLoading, setIsLoading] = useState(true);

  // State Filter Kanan Atas
  const [topDate, setTopDate] = useState('2026-04-10');

  // State Filter Bar Tengah
  const [filterDate, setFilterDate] = useState('10/04/2026');
  const [filterGuru, setFilterGuru] = useState('Semua Guru');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterLokasi, setFilterLokasi] = useState('Semua');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Ambil total guru untuk stats
      const { count } = await supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'guru');
      
      // Ambil data absensi join profil
      const { data: attData, error } = await supabase
        .from('attendances')
        .select(`
          id, date, check_in_time, check_out_time, status, photo_in, location_lat, location_long,
          profiles!inner(full_name, subject)
        `)
        .eq('date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (attData && attData.length > 0) {
        const mappedData: AttendanceRecord[] = attData.map(item => ({
          id: item.id,
          nama_guru: item.profiles?.full_name || 'Tanpa Nama',
          mata_pelajaran: item.date || '', // Di mockup tertulis format tanggal
          jenis_absensi: item.check_in_time ? 'Masuk' : '',
          jam: item.check_in_time || '',
          lokasi: (item.location_lat && item.location_long) ? `${item.location_lat}, ${item.location_long}` : '-',
          jarak: '30 m', // Dummy jarak karena butuh API Maps
          foto: item.photo_in || null,
          status: item.status === 'hadir' ? 'Hadir' : item.status === 'terlambat' ? 'Terlambat' : item.status === 'tidak_hadir' ? 'Tidak Hadir' : 'Izin'
        }));

        setData(mappedData);
        setFilteredData(mappedData);

        const totalGuru = count || 100;
        const hadir = mappedData.filter(x => x.status === 'Hadir').length;
        const tidakHadir = mappedData.filter(x => x.status === 'Tidak Hadir').length;
        const terlambat = mappedData.filter(x => x.status === 'Terlambat').length;
        const izin = mappedData.filter(x => x.status === 'Izin').length;

        setStats({ total: totalGuru, hadir, tidakHadir, terlambat, izin });
      } else {
        // Fallback jika kosong
        throw new Error("Data Kosong");
      }
    } catch (err) {
      console.log("Menggunakan Data Dummy");
      setData(DUMMY_DATA);
      setFilteredData(DUMMY_DATA);
      setStats(DUMMY_STATS);
    } finally {
      setIsLoading(false);
    }
  }

  // LOGIKA FILTER AKTIF
  const handleTopFilter = () => {
      // Sinkronkan filter bawah dengan atas (Contoh manipulasi state)
      const parts = topDate.split('-');
      if(parts.length === 3) {
          setFilterDate(`${parts[2]}/${parts[1]}/${parts[0]}`);
      }
      applyFilters();
  };

  const applyFilters = () => {
      let result = [...data];
      
      if (filterGuru !== 'Semua Guru') {
          result = result.filter(item => item.nama_guru.toLowerCase().includes(filterGuru.toLowerCase()));
      }
      if (filterJenis !== 'Semua') {
          result = result.filter(item => item.jenis_absensi === filterJenis);
      }
      
      setFilteredData(result);
  };

  // HELPER WARNA & PERSENTASE
  const getPercentage = (value: number) => {
      if(stats.total === 0) return '0%';
      return `${Math.round((value / stats.total) * 100)}%`;
  };

  const getStatusBadge = (status: string) => {
      if(!status) return null;
      switch(status.toLowerCase()) {
          case 'hadir': 
            return <span className="border border-green-200 bg-green-50 text-green-600 px-3 py-1 rounded text-[11px] font-semibold">{status}</span>;
          case 'terlambat': 
            return <span className="border border-yellow-200 bg-yellow-50 text-yellow-600 px-3 py-1 rounded text-[11px] font-semibold">{status}</span>;
          case 'tidak hadir': 
            return <span className="border border-red-200 bg-red-50 text-red-600 px-3 py-1 rounded text-[11px] font-semibold">{status}</span>;
          default: 
            return <span className="border border-blue-200 bg-blue-50 text-blue-600 px-3 py-1 rounded text-[11px] font-semibold">{status}</span>;
      }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">
      <div className="px-8 pt-8 space-y-6">
          
        {/* --- TOP SECTION (STATS & DATE) --- */}
        <div className="flex flex-col xl:flex-row gap-6 items-stretch">
            
            {/* 5 Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-1">
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-center">
                    <p className="text-[13px] font-bold text-[#14b8a6] mb-3">Total Guru</p>
                    <span className="text-[28px] font-bold text-gray-900">{stats.total}</span>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-center relative">
                    <p className="text-[13px] font-bold text-[#22c55e] mb-3">Hadir Hari Ini</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-bold text-gray-900">{stats.hadir}</span>
                        <span className="text-[11px] font-bold text-[#1e3a8a] ml-1">orang ({getPercentage(stats.hadir)})</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-center relative">
                    <p className="text-[13px] font-bold text-[#ef4444] mb-3">Tidak Hadir</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-bold text-[#ef4444]">{stats.tidakHadir}</span>
                        <span className="text-[11px] font-bold text-[#1e3a8a] ml-1">orang ({getPercentage(stats.tidakHadir)})</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-center relative">
                    <p className="text-[13px] font-bold text-[#eab308] mb-3">Terlambat</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-bold text-[#eab308]">{stats.terlambat}</span>
                        <span className="text-[11px] font-bold text-[#1e3a8a] ml-1">orang ({getPercentage(stats.terlambat)})</span>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col justify-center relative">
                    <p className="text-[13px] font-bold text-[#3b82f6] mb-3">Izin</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-bold text-[#3b82f6]">{stats.izin}</span>
                        <span className="text-[11px] font-bold text-[#1e3a8a] ml-1">orang ({getPercentage(stats.izin)})</span>
                    </div>
                </div>
            </div>

            {/* KOTAK TANGGAL KANAN */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 w-full xl:w-[300px] flex flex-col justify-center">
                <h3 className="font-bold text-[16px] text-gray-900 mb-3">Tanggal</h3>
                <div className="relative mb-3">
                    <select 
                       className="w-full border border-gray-200 text-gray-600 text-[13px] rounded-md px-3 py-2.5 focus:outline-none appearance-none cursor-pointer bg-white"
                       value={topDate} onChange={e => setTopDate(e.target.value)}
                    >
                        <option value="2026-04-10">10 April 2026</option>
                        <option value="2026-04-11">11 April 2026</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button 
                  onClick={handleTopFilter}
                  className="w-full bg-[#3b82f6] hover:bg-blue-700 text-white font-semibold text-[12px] py-2.5 rounded-md transition-colors"
                >
                    Tampilkan
                </button>
            </div>
        </div>

        {/* --- FILTER BAR TENGAH --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 flex flex-wrap items-center gap-4">
            
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Tanggal</span>
                <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>10/04/2026</option><option>11/04/2026</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Pilih Guru</span>
                <input 
                    type="text" placeholder="Semua Guru" value={filterGuru} onChange={e => setFilterGuru(e.target.value)}
                    className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none"
                />
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Jenis Absensi</span>
                <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option><option>Masuk</option><option>Pulang</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Status Lokasi</span>
                <select value={filterLokasi} onChange={(e) => setFilterLokasi(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option><option>Sesuai Radius</option><option>Diluar Radius</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button onClick={applyFilters} className="w-full sm:w-24 bg-[#4455f0] hover:bg-blue-700 text-white px-4 py-2.5 rounded-md text-[13px] font-semibold transition-colors mt-1">
                Filter
            </button>
        </div>

        {/* --- TABEL DATA --- */}
        <div className="bg-white rounded-t-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100">
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#f8fafc] text-gray-700 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 w-16">No</th>
                            <th className="px-6 py-4">Nama Guru</th>
                            <th className="px-6 py-4">Mata Pelajaran</th>
                            <th className="px-6 py-4 text-center">Jenis Absensi</th>
                            <th className="px-6 py-4">Jam</th>
                            <th className="px-6 py-4">Lokasi</th>
                            <th className="px-6 py-4">Jarak</th>
                            <th className="px-6 py-4 text-center">Foto Selfie</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-500 font-medium">
                        {isLoading ? (
                            <tr><td colSpan={10} className="px-6 py-10 text-center">Memuat data...</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={10} className="px-6 py-10 text-center">Data tidak ditemukan</td></tr>
                        ) : (
                            filteredData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-4 text-gray-600">{item.nama_guru}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.mata_pelajaran}</td>
                                    <td className="px-6 py-4 text-center">
                                        {item.jenis_absensi && (
                                            <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded text-[11px] font-semibold">{item.jenis_absensi}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{item.jam}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.lokasi}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.jarak}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {item.foto ? <img src={item.foto} alt="Selfie" className="w-7 h-7 rounded object-cover" /> : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            {item.nama_guru ? ( // Hanya tampilkan aksi jika ada datanya
                                              <>
                                                <button className="text-gray-400 hover:text-gray-600 transition-colors"><Edit className="w-4 h-4" /></button>
                                                <button className="text-red-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                              </>
                                            ) : null}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination */}
            <div className="bg-[#f4f7fc] px-6 py-5 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4 mt-10">
                <span className="text-[13px] text-gray-600 font-bold">
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
  );
}