import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, ChevronDown, Users, User } from 'lucide-react';

// --- DATA DUMMY ---
const DUMMY_STATS = {
  totalGuru: 100, hadirHariIni: 91, tidakHadir: 6, terlambat: 5, izin: 3, tingkatKehadiran: 7 
};

const DUMMY_LINE_CHART = [
  { label: '00:00', hadir: 10, terlambat: 15, absen: 30 },
  { label: '01:00', hadir: 32, terlambat: 10,  absen: 40 },
  { label: '02:00', hadir: 45, terlambat: 32, absen: 28 },
  { label: '03:00', hadir: 32, terlambat: 18, absen: 50 },
  { label: '04:00', hadir: 34, terlambat: 9, absen: 42 },
  { label: '05:00', hadir: 52, terlambat: 25, absen: 82 },
  { label: '06:00', hadir: 40, terlambat: 10, absen: 55 },
];

const DUMMY_REKAP = [
  { id: '1', nama: 'Jamal', hadirStr: 'Hadir', terlambat: '2', tidakHadir: '1', izin: '0', persentase: '93%', color: 'text-[#22c55e]' },
  { id: '2', nama: 'Anton', hadirStr: '0', terlambat: '0', tidakHadir: '1', izin: '0', persentase: '90%', color: 'text-[#22c55e]' },
  { id: '3', nama: 'Jeno', hadirStr: '0', terlambat: '2', tidakHadir: '0', izin: '0', persentase: '81%', color: 'text-[#eab308]' },
  { id: '4', nama: 'Naila', hadirStr: '0', terlambat: '1', tidakHadir: '0', izin: '1', persentase: '90%', color: 'text-[#22c55e]' },
  { id: '5', nama: 'Karina', hadirStr: '0', terlambat: '0', tidakHadir: '-', izin: '-', persentase: '70%', color: 'text-[#ef4444]' },
];

export default function AdminLaporanPage() {
  const { profile } = useAuth();
  
  // State Data
  const [stats, setStats] = useState(DUMMY_STATS);
  const [lineData, setLineData] = useState(DUMMY_LINE_CHART);
  const [rekapData, setRekapData] = useState(DUMMY_REKAP);
  const [isLoading, setIsLoading] = useState(true);

  // State Filters
  const [filterLaporan, setFilterLaporan] = useState('Rekap Kehadiran');
  const [filterPeriode, setFilterPeriode] = useState('01 Mei - 2026 - 31 Mei');
  const [filterMapel, setFilterMapel] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');

  // STATE TOOLTIP HOVER GRAFIK
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, title: '', label: '', value: '', color: '' });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [gRes, aRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'guru'),
          supabase.from('attendances').select('*').eq('date', today),
        ]);

        if (gRes.data || aRes.data) {
          const atts = aRes.data || [];
          setStats({
            totalGuru: gRes.count || DUMMY_STATS.totalGuru,
            hadirHariIni: atts.filter(x => ['hadir'].includes(x.status)).length || DUMMY_STATS.hadirHariIni,
            tidakHadir: atts.filter(x => x.status === 'tidak_hadir').length || DUMMY_STATS.tidakHadir,
            terlambat: atts.filter(x => x.status === 'terlambat').length || DUMMY_STATS.terlambat,
            izin: atts.filter(x => ['izin', 'sakit', 'cuti'].includes(x.status)).length || DUMMY_STATS.izin,
            tingkatKehadiran: DUMMY_STATS.tingkatKehadiran
          });
        }
      } catch (err) {
        console.log("Database belum siap, menggunakan Data Dummy");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // --- LOGIKA HOVER TOOLTIP ---
  const handleMouseMove = (e: React.MouseEvent, title: string, label: string, value: string | number, color: string) => {
      setTooltip({ show: true, x: e.clientX, y: e.clientY, title, label, value: String(value), color });
  };
  const hideTooltip = () => setTooltip({ ...tooltip, show: false });

  // --- LOGIKA MATE-MATIKA GRAFIK GARIS (LINE CHART) ---
  const lineChartHeight = 150;
  const lineChartWidth = 400;
  const maxLineVal = Math.max(...lineData.flatMap(d => [d.hadir, d.terlambat, d.absen]), 100);
  const xStep = lineChartWidth / (lineData.length - 1 || 1);

  const getSmoothPath = (dataKey: 'hadir' | 'terlambat' | 'absen') => {
      let path = '';
      lineData.forEach((d, i) => {
          const x = i * xStep;
          const y = lineChartHeight - (d[dataKey] / maxLineVal) * lineChartHeight;
          if (i === 0) path += `M ${x} ${y} `;
          else {
             const prevX = (i - 1) * xStep;
             const prevY = lineChartHeight - (lineData[i-1][dataKey] / maxLineVal) * lineChartHeight;
             const cp1x = prevX + xStep / 2, cp1y = prevY;
             const cp2x = x - xStep / 2, cp2y = y;
             path += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y} `;
          }
      });
      return path;
  };

  const getFillAreaPath = (dataKey: 'hadir' | 'terlambat' | 'absen') => {
      const linePath = getSmoothPath(dataKey);
      return `${linePath} L ${lineChartWidth} ${lineChartHeight} L 0 ${lineChartHeight} Z`;
  };

  // --- LOGIKA EXPORT EXCEL & PDF ---
  const handleExportExcel = () => {
    // 1. Buat Header CSV
    let csvContent = "No,Nama Guru,Hadir,Terlambat,Tidak Hadir,Izin,Persentase\n";
    
    // 2. Looping Data Tabel ke format CSV
    rekapData.forEach((item, index) => {
        const hadir = item.hadirStr === 'Hadir' ? '1' : item.hadirStr || '0';
        csvContent += `${index + 1},${item.nama},${hadir},${item.terlambat},${item.tidakHadir},${item.izin},${item.persentase}\n`;
    });

    // 3. Buat File Blob & Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Laporan_Kehadiran_Guru.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Membuka dialog print bawaan browser
    // Pengguna tinggal mengganti "Destination" menjadi "Save to PDF"
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10">
      
      {/* TOOLTIP PORTAL MENGAPUNG (Z-INDEX TINGGI) */}
      {tooltip.show && (
          <div 
             className="fixed z-[9999] bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[120%] transition-opacity duration-150"
             style={{ left: tooltip.x, top: tooltip.y }}
          >
             <p className="text-[11px] text-gray-300 font-medium mb-1 border-b border-gray-700 pb-1">{tooltip.title}</p>
             <div className="flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: tooltip.color }}></span>
                 <p className="text-sm font-bold">{tooltip.label}: <span className="font-normal">{tooltip.value}</span></p>
             </div>
          </div>
      )}

     

      <div className="px-8 pt-6 space-y-6">

        {/* --- FILTER BAR (Sembunyikan saat Print PDF) --- */}
        <div className="flex flex-wrap lg:flex-nowrap items-end gap-4 w-full print:hidden">
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Jenis laporan</span>
                <select value={filterLaporan} onChange={e => setFilterLaporan(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer">
                    <option>Rekap Kehadiran</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-[1.2] relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Periode</span>
                <select value={filterPeriode} onChange={e => setFilterPeriode(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer">
                    <option>01 Mei - 2026 - 31 Mei..</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-[1.2] relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Mata pelajaran</span>
                <select value={filterMapel} onChange={e => setFilterMapel(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="w-full sm:w-auto flex-1 relative border border-gray-200 rounded-md px-3 py-1.5 bg-white">
                <span className="block text-[10px] text-gray-400 font-medium">Kelas</span>
                <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="w-full bg-transparent text-[13px] text-gray-700 font-medium focus:outline-none appearance-none cursor-pointer">
                    <option>Semua</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            <button onClick={() => setIsLoading(true)} className="w-full sm:w-[120px] h-[46px] bg-[#4455f0] hover:bg-blue-700 text-white rounded-md text-[12px] font-semibold transition-colors">
                Tampilkan
            </button>

            {/* Spacer */}
            <div className="hidden xl:block flex-1"></div>

            {/* Export Buttons */}
            <div className="flex items-center gap-3">
                <button onClick={handleExportExcel} className="h-[34px] px-4 bg-[#ecfdf5] border border-[#10b981] text-[#10b981] hover:bg-green-100 rounded-md text-[11px] font-bold transition-colors">
                    Export Excel
                </button>
                <button onClick={handleExportPDF} className="h-[34px] px-4 bg-[#fef2f2] border border-[#ef4444] text-[#ef4444] hover:bg-red-100 rounded-md text-[11px] font-bold transition-colors">
                    Export PDF
                </button>
            </div>
        </div>

        {/* --- ROW 2: 6 STATS CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)]">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Total Guru</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-gray-900" />
                        <span className="text-3xl font-bold text-gray-900">{stats.totalGuru}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
                </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)]">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Hadir Hari Ini</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <User className="w-8 h-8 text-gray-900 fill-gray-900" />
                        <span className="text-3xl font-bold text-[#22c55e]">{stats.hadirHariIni}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
                </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)]">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Tidak Hadir</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <span className="text-3xl font-bold text-[#ef4444]">{stats.tidakHadir}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
                </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)]">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Terlambat</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <span className="text-3xl font-bold text-[#eab308]">{stats.terlambat}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
                </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)]">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Izin</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <span className="text-3xl font-bold text-[#3b82f6]">{stats.izin}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
                </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)]">
                <p className="text-[13px] font-bold text-gray-800 mb-3">Tingkat Kehadiran</p>
                <div className="flex items-end justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                        <span className="text-3xl font-bold text-[#ef4444]">{stats.tingkatKehadiran}</span>
                    </div>
                    <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
                </div>
            </div>
        </div>

        {/* --- ROW 3: CHARTS & SUMMARY --- */}
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr_1fr] gap-6 items-stretch">
            
            {/* GRAFIK 1: Garis */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] relative overflow-hidden flex flex-col">
                <h3 className="text-[14px] font-bold text-gray-900 mb-6">Grafik Kehadiran (Per Hari)</h3>
                <div className="flex-1 w-full relative min-h-[220px]">
                    <svg viewBox="-10 -10 420 180" className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="glowGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15"/><stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="glowOrange" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.15"/><stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                            </linearGradient>
                        </defs>
                        {/* Grid & Label Y */}
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                           const y = lineChartHeight * ratio;
                           const label = Math.round(maxLineVal * (1 - ratio));
                           return (
                             <g key={y}>
                               <line x1="0" y1={y} x2={lineChartWidth} y2={y} stroke="#f3f4f6" strokeWidth="1"/>
                               <text x="-15" y={y + 3} fontSize="8" fill="#9ca3af" textAnchor="end">{label}</text>
                             </g>
                           )
                        })}
                        {/* Label X */}
                        {lineData.map((d, i) => (
                           <text key={i} x={i * xStep} y={lineChartHeight + 20} fontSize="8" fill="#9ca3af" textAnchor="middle">{d.label}</text>
                        ))}
                        {/* Area Gradien */}
                        <path d={getFillAreaPath('absen')} fill="url(#glowBlue)" />
                        <path d={getFillAreaPath('hadir')} fill="url(#glowGreen)" />
                        <path d={getFillAreaPath('terlambat')} fill="url(#glowOrange)" />
                        
                        {/* Garis */}
                        <path d={getSmoothPath('absen')} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                        <path d={getSmoothPath('hadir')} fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        <path d={getSmoothPath('terlambat')} fill="none" stroke="#f97316" strokeWidth="1.5" />
                        
                        {/* Titik Interaktif Tooltip */}
                        {lineData.map((d, i) => {
                           const x = i * xStep;
                           const yH = lineChartHeight - (d.hadir / maxLineVal) * lineChartHeight;
                           const yT = lineChartHeight - (d.terlambat / maxLineVal) * lineChartHeight;
                           const yA = lineChartHeight - (d.absen / maxLineVal) * lineChartHeight;
                           return (
                             <g key={i}>
                               <circle cx={x} cy={yA} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[6px] transition-all"
                                  onMouseEnter={(e) => handleMouseMove(e, d.label, 'Tidak Hadir', d.absen, '#3b82f6')} onMouseLeave={hideTooltip} />
                               <circle cx={x} cy={yH} r="4" fill="#22c55e" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[6px] transition-all"
                                  onMouseEnter={(e) => handleMouseMove(e, d.label, 'Hadir', d.hadir, '#22c55e')} onMouseLeave={hideTooltip} />
                               <circle cx={x} cy={yT} r="4" fill="#f97316" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[6px] transition-all"
                                  onMouseEnter={(e) => handleMouseMove(e, d.label, 'Terlambat', d.terlambat, '#f97316')} onMouseLeave={hideTooltip} />
                             </g>
                           )
                        })}
                    </svg>
                </div>
            </div>

            {/* GRAFIK 2: Donut Chart Interaktif */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col items-center justify-center">
                <h3 className="text-[14px] font-bold text-gray-900 w-full mb-6">Grafik Berdasarkan Status</h3>
                
                <div className="flex flex-row items-center gap-6 w-full justify-center">
                    {/* SVG Donut */}
                    <div className="relative w-32 h-32 shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                           <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="15" />
                           {/* Hadir (70.83%) */}
                           <circle cx="50" cy="50" r="40" fill="transparent" stroke="#22c55e" strokeWidth="15" strokeDasharray="178 251.3" strokeDashoffset="0" 
                              className="cursor-pointer hover:stroke-[18px] transition-all"
                              onMouseEnter={(e) => handleMouseMove(e, 'Hadir', 'Status', '85 (70.83%)', '#22c55e')} onMouseLeave={hideTooltip} />
                           {/* Terlambat (16.67%) */}
                           <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f97316" strokeWidth="15" strokeDasharray="41.9 251.3" strokeDashoffset="-178" 
                              className="cursor-pointer hover:stroke-[18px] transition-all"
                              onMouseEnter={(e) => handleMouseMove(e, 'Terlambat', 'Status', '20 (16.67%)', '#f97316')} onMouseLeave={hideTooltip} />
                           {/* Tidak Hadir (8.33%) */}
                           <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ef4444" strokeWidth="15" strokeDasharray="20.9 251.3" strokeDashoffset="-219.9" 
                              className="cursor-pointer hover:stroke-[18px] transition-all"
                              onMouseEnter={(e) => handleMouseMove(e, 'Tidak Hadir', 'Status', '10 (8.33%)', '#ef4444')} onMouseLeave={hideTooltip} />
                           {/* Izin (4.17%) */}
                           <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="15" strokeDasharray="10.5 251.3" strokeDashoffset="-240.8" 
                              className="cursor-pointer hover:stroke-[18px] transition-all"
                              onMouseEnter={(e) => handleMouseMove(e, 'Izin', 'Status', '5 (4.17%)', '#3b82f6')} onMouseLeave={hideTooltip} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] text-gray-500 font-semibold mb-0.5">Total</span>
                            <span className="text-[22px] font-bold text-gray-800 leading-none">120</span>
                            <span className="text-[8px] text-gray-500 font-semibold mt-0.5">Kehadiran</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-3 text-[11px] font-semibold text-gray-600">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]"></span> Hadir</div>
                            <span className="text-gray-400">85 (70.83%)</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#f97316]"></span> Terlambat</div>
                            <span className="text-gray-400">20 (16.67%)</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]"></span> Tidak Hadir</div>
                            <span className="text-gray-400">10 (8.33%)</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]"></span> Izin</div>
                            <span className="text-gray-400">5 (4.17%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RINGKASAN */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] flex flex-col">
                <h3 className="text-[14px] font-bold text-gray-900 mb-6">Ringkasan</h3>
                <div className="space-y-5 text-[12px] font-semibold flex-1">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-800">Total Guru</span>
                        <span className="text-gray-900">100</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-800">Hari Kerja</span>
                        <span className="text-gray-900">22 Hari</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-800">Rata-rata Kehadiran</span>
                        <span className="text-gray-900">87,10%</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-gray-800">Lainnya</span>
                    </div>
                </div>
            </div>

        </div>

        {/* --- ROW 4: TABEL REKAP KEHADIRAN --- */}
        <div className="bg-white rounded-xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100">
            <div className="p-5 border-b border-gray-100">
                <h3 className="text-[14px] font-bold text-[#1e3a8a] ml-1">Rekap Kehadiran Guru</h3>
            </div>
            <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-left text-[13px]">
                    <thead className="bg-[#f8fafc] text-gray-800 font-bold border-b border-gray-100">
                        <tr>
                            <th className="px-7 py-4 w-16">No</th>
                            <th className="px-7 py-4">Nama Guru</th>
                            <th className="px-7 py-4">Hadir</th>
                            <th className="px-7 py-4">Terlambat</th>
                            <th className="px-7 py-4">Tidak Hadir</th>
                            <th className="px-7 py-4">Izin</th>
                            <th className="px-7 py-4">Presentase</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-500 font-medium">
                        {isLoading ? (
                            <tr><td colSpan={7} className="px-7 py-10 text-center">Memuat data...</td></tr>
                        ) : (
                            rekapData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-7 py-4 text-gray-400">{index + 1}</td>
                                    <td className="px-7 py-4 text-gray-600">{item.nama}</td>
                                    <td className="px-7 py-4">{item.hadirStr}</td>
                                    <td className="px-7 py-4">{item.terlambat}</td>
                                    <td className="px-7 py-4">{item.tidakHadir}</td>
                                    <td className="px-7 py-4">{item.izin}</td>
                                    <td className={`px-7 py-4 font-bold ${item.color}`}>
                                        {item.persentase}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}