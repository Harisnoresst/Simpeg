import { useEffect, useState } from 'react';
import api from '../../lib/axios'; // <-- Gunakan axios
import { useAuth } from '../../contexts/AuthContext';
import { ChevronDown, Edit, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function AdminAbsensiPage() {
  const { profile } = useAuth();
  
  // State Data
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // State Filter (Menggunakan 1 State Tanggal agar tersinkronisasi)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr); // YYYY-MM-DD (Format Kalender)
  
  const [filterGuru, setFilterGuru] = useState('');
  const [filterJenis, setFilterJenis] = useState('Semua');
  const [filterLokasi, setFilterLokasi] = useState('Semua');

  // Load Data dari Database saat Tanggal berubah
  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Efek untuk memfilter data secara lokal tanpa perlu tembak API lagi
  useEffect(() => {
    applyFilters();
  }, [data, filterGuru, filterJenis, filterLokasi]);

  async function loadData(dateString: string) {
    setIsLoading(true);
    try {
      // Panggil API Laravel dengan parameter tanggal
      const response = await api.get(`/admin/attendances?date=${dateString}`);
      
      setData(response.data.data);
      setStats(response.data.stats);
    } catch (err) {
      console.error("Gagal mengambil data absensi:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // --- LOGIKA FILTER FRONTEND ---
  const applyFilters = () => {
      let result = [...data];
      
      // Filter Nama Guru
      if (filterGuru) {
          result = result.filter(item => item.nama_guru.toLowerCase().includes(filterGuru.toLowerCase()));
      }
      
      // Filter Jenis Absensi (Tampilkan yang punya data masuk/pulang)
      if (filterJenis === 'Masuk') {
          result = result.filter(item => item.check_in_time);
      } else if (filterJenis === 'Pulang') {
          result = result.filter(item => item.check_out_time);
      }

      setFilteredData(result);
  };

  // --- HELPER WARNA & PERSENTASE ---
  const getPercentage = (value: number) => {
      if(stats.total === 0) return '0%';
      return `${Math.round((value / stats.total) * 100)}%`;
  };

  const getStatusBadge = (status: string) => {
      if(!status) return <span className="border border-gray-200 bg-gray-50 text-gray-400 px-3 py-1 rounded text-[11px] font-semibold">-</span>;
      
      switch(status.toLowerCase()) {
          case 'hadir': 
            return <span className="border border-green-200 bg-green-50 text-green-600 px-3 py-1 rounded text-[11px] font-semibold">Hadir</span>;
          case 'terlambat': 
            return <span className="border border-yellow-200 bg-yellow-50 text-yellow-600 px-3 py-1 rounded text-[11px] font-semibold">Terlambat</span>;
          case 'tidak_hadir': case 'tidak hadir': 
            return <span className="border border-red-200 bg-red-50 text-red-600 px-3 py-1 rounded text-[11px] font-semibold">Tidak Hadir</span>;
          default: 
            return <span className="border border-blue-200 bg-blue-50 text-blue-600 px-3 py-1 rounded text-[11px] font-semibold">Izin/Cuti</span>;
      }
  };

  // Helper untuk menentukan data mana yang ditampilkan (Masuk / Pulang) berdasarkan Filter Jenis
  const getRowDisplayData = (item: any) => {
      let jam = '-'; let lokasi = '-'; let jarak = '-'; let foto = null; let jenis = '-';

      if (filterJenis === 'Pulang' || (filterJenis === 'Semua' && !item.check_in_time && item.check_out_time)) {
          // Tampilkan Data Pulang
          jenis = 'Pulang';
          jam = item.check_out_time || '-';
          lokasi = item.check_out_lat ? `${item.check_out_lat.substring(0, 7)}, ${item.check_out_lng.substring(0, 8)}` : '-';
          
          // PERBAIKAN: Cek spesifik null/undefined agar angka 0 tetap tercetak sebagai "0 m"
          jarak = (item.distance_check_out !== null && item.distance_check_out !== undefined) ? `${Math.round(item.distance_check_out)} m` : '-';
          foto = item.check_out_photo;
      } else {
          // Tampilkan Data Masuk (Default)
          jenis = item.check_in_time ? 'Masuk' : '-';
          jam = item.check_in_time || '-';
          lokasi = item.check_in_lat ? `${item.check_in_lat.substring(0, 7)}, ${item.check_in_lng.substring(0, 8)}` : '-';
          
          // PERBAIKAN: Cek spesifik null/undefined agar angka 0 tetap tercetak sebagai "0 m"
          jarak = (item.distance_check_in !== null && item.distance_check_in !== undefined) ? `${Math.round(item.distance_check_in)} m` : '-';
          foto = item.check_in_photo;
      }
      return { jam, lokasi, jarak, foto, jenis };
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
                    <p className="text-[13px] font-bold text-[#22c55e] mb-3">Hadir</p>
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
                    <p className="text-[13px] font-bold text-[#3b82f6] mb-3">Izin/Cuti</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-[28px] font-bold text-[#3b82f6]">{stats.izin}</span>
                        <span className="text-[11px] font-bold text-[#1e3a8a] ml-1">orang ({getPercentage(stats.izin)})</span>
                    </div>
                </div>
            </div>

            {/* KOTAK TANGGAL KANAN */}
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-5 w-full xl:w-[280px] flex flex-col justify-center border border-gray-100">
                <h3 className="font-bold text-[14px] text-gray-900 mb-3">Filter Tanggal Utama</h3>
                <div className="relative mb-3">
                    <input 
                       type="date" 
                       className="w-full border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg px-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer bg-white"
                       value={selectedDate} 
                       onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>
                <button 
                  onClick={() => loadData(selectedDate)}
                  className="w-full bg-[#2563eb] hover:bg-blue-700 text-white font-semibold text-[13px] py-2.5 rounded-lg transition-colors shadow-sm"
                >
                    Terapkan Tanggal
                </button>
            </div>
        </div>

        {/* --- FILTER BAR TENGAH --- */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-5 flex flex-wrap items-center gap-4">
            
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Pilih Guru</span>
                <input 
                    type="text" placeholder="Cari nama guru..." 
                    value={filterGuru} onChange={e => setFilterGuru(e.target.value)}
                    className="w-full bg-transparent text-[13px] font-medium text-gray-700 focus:outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Jenis Absensi</span>
                <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="w-full bg-transparent font-medium text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option value="Semua">Semua (Masuk/Pulang)</option>
                    <option value="Masuk">Jam Masuk Saja</option>
                    <option value="Pulang">Jam Pulang Saja</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 hover:border-blue-300 rounded-lg px-3 py-1.5 bg-white transition-colors group">
                <span className="block text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Status Lokasi</span>
                <select value={filterLokasi} onChange={(e) => setFilterLokasi(e.target.value)} className="w-full bg-transparent font-medium text-[13px] text-gray-700 focus:outline-none appearance-none cursor-pointer">
                    <option>Semua Status</option><option>Sesuai Radius</option><option>Diluar Radius</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
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
                            <th className="px-6 py-4">Lokasi (Lat, Lng)</th>
                            <th className="px-6 py-4">Jarak</th>
                            <th className="px-6 py-4 text-center">Foto Selfie</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-500 font-medium">
                        {isLoading ? (
                            <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400">sabar yak lagi ambil data dari databse dulu..</td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400">Tidak ada data absensi untuk filter ini</td></tr>
                        ) : (
                            filteredData.map((item, index) => {
                                // Ambil data yang pas untuk dirender (Masuk atau Pulang)
                                const display = getRowDisplayData(item);

                                return (
                                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                                    <td className="px-6 py-4 text-gray-800 font-bold">{item.nama_guru}</td>
                                    <td className="px-6 py-4 text-gray-500">{item.mata_pelajaran || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        {display.jenis !== '-' && (
                                            <span className={`px-3 py-1 rounded text-[11px] font-bold ${display.jenis === 'Masuk' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#e0e7ff] text-[#3730a3]'}`}>
                                                {display.jenis}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{display.jam ? display.jam.substring(0,5) : '-'}</td>
                                    <td className="px-6 py-4 text-gray-500 text-[11px]">{display.lokasi}</td>
                                    <td className="px-6 py-4 text-gray-500">{display.jarak}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            {display.foto ? (
                                                <a href={display.foto} target="_blank" rel="noreferrer">
                                                    <img src={display.foto} alt="Selfie" className="w-8 h-8 rounded-md object-cover shadow-sm hover:opacity-80" />
                                                </a>
                                            ) : <span className="text-gray-300">-</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(item.status)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            {item.check_in_time ? (
                                              <>
                                                <button className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                                                <button className="text-gray-400 hover:text-red-600 transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                                              </>
                                            ) : <span className="text-gray-300">-</span>}
                                        </div>
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-[#f4f7fc] px-6 py-5 flex items-center justify-between border-t border-gray-100">
                <span className="text-[13px] text-gray-600 font-bold">Total {filteredData.length} data</span>
            </div>
        </div>

      </div>
    </div>
  );
}