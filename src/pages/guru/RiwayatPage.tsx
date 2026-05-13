import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Monitor, FileX, History, ClipboardList, ChevronLeft, ChevronRight, ArrowLeft, Bell } from 'lucide-react';

// --- Tipe Data Dummy ---
type DummyAttendance = {
  id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: 'hadir' | 'terlambat' | 'tidak_hadir' | 'izin';
  photo_in: string | null;
  photo_out: string | null;
  notes: string | null;
};

const DUMMY_DATA: DummyAttendance[] = Array.from({ length: 20 }).map((_, i) => {
  const day = String(i + 1).padStart(2, '0');
  const statusRnd = i % 7 === 0 ? 'izin' : i % 5 === 0 ? 'terlambat' : i === 15 ? 'tidak_hadir' : 'hadir';
  return {
    id: String(i + 1),
    date: `2026-04-${day}`,
    check_in_time: statusRnd !== 'tidak_hadir' && statusRnd !== 'izin' ? `07.${15 + (i % 20)}` : null,
    check_out_time: statusRnd !== 'tidak_hadir' && statusRnd !== 'izin' ? '15.00' : null,
    status: statusRnd,
    photo_in: statusRnd !== 'tidak_hadir' ? `/profil.png` : null,
    photo_out: statusRnd !== 'tidak_hadir' ? `/profil2.png` : null,
    notes: statusRnd === 'izin' ? 'Izin keperluan keluarga' : statusRnd === 'tidak_hadir' ? 'Tanpa keterangan' : null,
  };
});

// GENERATE PILIHAN BULAN (12 Bulan untuk Tahun 2026)
const MONTH_OPTIONS = [
  { value: '2026-01', label: 'Januari 2026' },
  { value: '2026-02', label: 'Februari 2026' },
  { value: '2026-03', label: 'Maret 2026' },
  { value: '2026-04', label: 'April 2026' },
  { value: '2026-05', label: 'Mei 2026' },
  { value: '2026-06', label: 'Juni 2026' },
  { value: '2026-07', label: 'Juli 2026' },
  { value: '2026-08', label: 'Agustus 2026' },
  { value: '2026-09', label: 'September 2026' },
  { value: '2026-10', label: 'Oktober 2026' },
  { value: '2026-11', label: 'November 2026' },
  { value: '2026-12', label: 'Desember 2026' },
];

// GENERATE PILIHAN TANGGAL (Contoh: April - Mei 2026 agar cocok dengan data)
const DATE_OPTIONS: string[] = [];
for(let i=1; i<=30; i++) DATE_OPTIONS.push(`2026-04-${String(i).padStart(2,'0')}`);
for(let i=1; i<=31; i++) DATE_OPTIONS.push(`2026-05-${String(i).padStart(2,'0')}`);

export default function RiwayatPage() {
  const { profile } = useAuth();
  const [rawData, setRawData] = useState<any[]>([]); 
  const [filteredData, setFilteredData] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(true);

  // Filter State (Dropdown)
  const [filterMonth, setFilterMonth] = useState(''); 
  const [filterDate, setFilterDate] = useState(''); 

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Ringkasan Kehadiran State
  const [summary, setSummary] = useState({ hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 });

  useEffect(() => {
    async function loadData() {
      if (!profile) return;
      setIsLoading(true);

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      
      try {
        const { data, error } = await supabase
          .from('attendances')
          .select('*')
          .eq('user_id', profile.id)
          .gte('date', startOfMonth)
          .order('date', { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
           const mappedData = data.map(item => ({
              ...item,
              photo_in: item.photo_in || null, 
              photo_out: item.photo_out || null,
              notes: item.notes || null,
           }));
           setRawData(mappedData);
           setFilteredData(mappedData);
           calculateSummary(mappedData);
        } else {
           setRawData(DUMMY_DATA);
           setFilteredData(DUMMY_DATA);
           calculateSummary(DUMMY_DATA);
        }
      } catch (err) {
        console.error("Gagal load data:", err);
        setRawData(DUMMY_DATA);
        setFilteredData(DUMMY_DATA);
        calculateSummary(DUMMY_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [profile]);

  // Fungsi Hitung Ringkasan
  const calculateSummary = (data: any[]) => {
      const newSummary = { hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 };
      data.forEach(a => {
        if (a.status === 'hadir') newSummary.hadir++;
        else if (a.status === 'tidak_hadir') newSummary.tidakHadir++;
        else if (a.status === 'terlambat') newSummary.terlambat++;
        else if (['izin', 'sakit', 'cuti'].includes(a.status)) newSummary.izin++;
      });
      setSummary(newSummary);
  };

  // Fungsi Menerapkan Filter Dropdown
  const handleApplyFilter = () => {
      let result = [...rawData];

      if (filterDate) {
          result = result.filter(item => item.date === filterDate);
      } else if (filterMonth) {
          result = result.filter(item => item.date.startsWith(filterMonth));
      }

      setFilteredData(result);
      calculateSummary(result);
      setCurrentPage(1); 
  };

  // LOGIKA PAGINATION
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page: number) => {
      if (page >= 1 && page <= totalPages) {
          setCurrentPage(page);
      }
  };

  // Helper Format Tanggal ("2026-04-02" ke "02-04-2026")
  const formatDateDisplay = (dateString: string) => {
    if(!dateString) return '-';
    const parts = dateString.split('-');
    if(parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return dateString;
  };

  // Helper Warna Status
  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'hadir': return 'text-green-600 bg-green-50 border border-green-200';
      case 'izin': return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'tidak_hadir': case 'tidak hadir': return 'text-red-600 bg-red-50 border border-red-200';
      case 'terlambat': return 'text-yellow-600 bg-yellow-50 border border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
      if(status === 'tidak_hadir') return 'Tidak Hadir';
      return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
      <div className="px-6 pb-6 pt-6">
          
        {/* BAGIAN ATAS: Ringkasan & Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
          {/* KIRI: Ringkasan Kehadiran */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
             <h3 className="font-bold text-lg text-gray-900 mb-5">Ringkasan Kehadiran</h3>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                  <p className="text-green-600 font-semibold text-sm mb-2">Hadir</p>
                  <p className="text-3xl font-bold text-green-600">{summary.hadir}</p>
                  <Monitor className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                  <p className="text-red-600 font-semibold text-sm mb-2">Tidak Hadir</p>
                  <p className="text-3xl font-bold text-red-600">{summary.tidakHadir}</p>
                  <FileX className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                  <p className="text-yellow-400 font-semibold text-sm mb-2">Terlambat</p>
                  <p className="text-3xl font-bold text-yellow-400">{summary.terlambat}</p>
                  <History className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                  <p className="text-blue-600 font-semibold text-sm mb-2">Izin</p>
                  <p className="text-3xl font-bold text-blue-600">{summary.izin}</p>
                  <ClipboardList className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                </div>
             </div>
          </div>

          {/* KANAN: Filter Riwayat */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
              <h3 className="font-bold text-lg text-gray-900 mb-5">Filter Riwayat</h3>
              
              <div className="flex gap-3 mb-4">
                  {/* Filter Bulan: Dropdown */}
                  <div className="flex-1 relative">
                      <select 
                        className="w-full border border-gray-200 text-gray-500 text-sm rounded-md px-3 py-2.5 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                        value={filterMonth}
                        onChange={(e) => {
                            setFilterMonth(e.target.value);
                            setFilterDate(''); // Reset tanggal jika bulan dipilih
                        }}
                      >
                          <option value="">Pilih Bulan</option>
                          {MONTH_OPTIONS.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>

                  {/* Filter Tanggal: Dropdown */}
                  <div className="flex-1 relative">
                      <span className="absolute left-3 top-[-8px] bg-white px-1 text-[10px] text-gray-400 z-10">Date</span>
                      <select 
                        className="w-full border border-gray-200 text-gray-700 text-sm rounded-md px-3 py-2.5 focus:outline-none focus:border-blue-500 appearance-none bg-white cursor-pointer"
                        value={filterDate}
                        onChange={(e) => {
                            setFilterDate(e.target.value);
                            setFilterMonth(''); // Reset bulan jika tanggal dipilih
                        }}
                      >
                          <option value="">Pilih Tanggal</option>
                          {DATE_OPTIONS.map(date => (
                              <option key={date} value={date}>{date.replace(/-/g, '/')}</option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                  </div>
              </div>

              <button 
                onClick={handleApplyFilter}
                className="w-full bg-[#4f46e5] hover:bg-[#4338ca] text-white text-sm font-medium py-2.5 rounded-md transition-colors mt-auto"
              >
                  Pilih
              </button>
          </div>

        </div>

        {/* TABEL RIWAYAT ABSENSI */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-bold text-[#2d3b8e]">Riwayat Absensi</h3>
             {filterDate || filterMonth ? (
                 <button onClick={() => { setFilterDate(''); setFilterMonth(''); setFilteredData(rawData); calculateSummary(rawData); setCurrentPage(1); }} className="text-xs text-red-500 hover:underline">Hapus Filter</button>
             ) : null}
          </div>
          
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f8fafc] text-gray-700 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 w-16">No</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Jam Masuk</th>
                  <th className="px-6 py-4">Jam Pulang</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Foto Masuk</th>
                  <th className="px-6 py-4 text-center">Foto Pulang</th>
                  <th className="px-6 py-4">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400">Tidak ada data untuk filter ini</td></tr>
                ) : paginatedData.map((att, index) => (
                  <tr key={att.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDateDisplay(att.date)}</td>
                    <td className="px-6 py-4 text-gray-600">{att.check_in_time || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{att.check_out_time || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-[11px] font-semibold w-[80px] ${getStatusStyle(att.status)}`}>
                        {getStatusLabel(att.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center">
                            {att.photo_in ? (
                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-200">
                                    <img src={att.photo_in} alt="Masuk" className="w-full h-full object-cover" />
                                </div>
                            ) : <span className="text-gray-400">-</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex justify-center">
                            {att.photo_out ? (
                                <div className="w-8 h-8 rounded overflow-hidden bg-gray-200">
                                    <img src={att.photo_out} alt="Pulang" className="w-full h-full object-cover" />
                                </div>
                            ) : <span className="text-gray-400">-</span>}
                        </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-gray-400">
                        {att.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Dinamis */}
          {totalPages > 0 && (
              <div className="px-6 py-5 flex items-center justify-between border-t border-gray-100">
                  <span className="text-sm text-gray-600 font-medium">
                      Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} data
                  </span>
                  <div className="flex items-center gap-1">
                      <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                          <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      {/* Render Tombol Halaman (1, 2, 3...) */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded font-medium text-sm border transition-colors ${
                                currentPage === page 
                                    ? 'bg-[#eef2ff] text-[#4f46e5] border-[#c7d2fe]' 
                                    : 'text-gray-600 hover:bg-gray-50 border-gray-200'
                            }`}
                          >
                              {page}
                          </button>
                      ))}

                      <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                          <ChevronRight className="w-5 h-5" />
                      </button>
                  </div>
              </div>
          )}
        </div>

        {/* Info Box Bawah */}
        <div className="mt-6 bg-[#f5f7ff] border border-[#dbeafe] rounded-lg p-4">
            <p className="text-sm">
                <span className="font-bold text-[#3b82f6]">Keterangan:</span> <span className="text-[#3b82f6]">Data riwayat absensi menampilkan catatan kehadiran Anda setiap hari berdasarkan aktivitas absensi masuk dan pulang</span>
            </p>
        </div>

      </div>
    
  );
}