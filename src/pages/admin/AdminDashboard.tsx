import { useEffect, useState } from 'react';
import { 
  Users, User, AlertTriangle, FileText, ChevronRight, 
  CheckCircle2, Bell, ChevronDown 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// --- DATA DUMMY (Fallback jika DB Kosong) ---
const DUMMY_STATS = { totalGuru: 100, hadirHariIni: 91, tidakHadir: 6, terlambat: 5, izin: 3, tidakValid: 7 };

const DUMMY_LINE_CHART = [
  { label: '00:00', hadir: 10, terlambat: 15, absen: 30 },
  { label: '01:00', hadir: 32, terlambat: 10,  absen: 40 },
  { label: '02:00', hadir: 45, terlambat: 32, absen: 28 },
  { label: '03:00', hadir: 32, terlambat: 18, absen: 50 },
  { label: '04:00', hadir: 34, terlambat: 9, absen: 42 },
  { label: '05:00', hadir: 52, terlambat: 25, absen: 82 },
  { label: '06:00', hadir: 40, terlambat: 10, absen: 55 },
];

const DUMMY_RADAR_DATA = [
  { subject: 'Informatika', alokasi: 100, aktual: 90 },
  { subject: 'Matematika', alokasi: 100, aktual: 60 },
  { subject: 'Seni', alokasi: 100, aktual: 85 },
  { subject: 'Fisika', alokasi: 100, aktual: 75 },
  { subject: 'Biologi', alokasi: 100, aktual: 88 },
  { subject: 'Kimia', alokasi: 100, aktual: 95 },
];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState(DUMMY_STATS);
  
  // State untuk Grafik
  const [lineData, setLineData] = useState(DUMMY_LINE_CHART);
  const [radarData, setRadarData] = useState(DUMMY_RADAR_DATA);
  
  // State Tooltip Kustom (Muncul saat kursor di-hover ke grafik)
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, title: '', label: '', value: '', color: '' });

  useEffect(() => {
    async function loadData() {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Hitung 7 Hari Terakhir untuk Line Chart
      const last7Days = Array.from({length: 7}, (_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - (6 - i));
         return d.toISOString().split('T')[0];
      });

      try {
        const [gRes, aRes, weekRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'guru'),
          supabase.from('attendances').select('*').eq('date', todayStr),
          supabase.from('attendances').select('date, status').gte('date', last7Days[0])
        ]);

        // 1. Update Kartu Statistik
        if (gRes.data || aRes.data) {
          const atts = aRes.data || [];
          setStats({
            totalGuru: gRes.count || DUMMY_STATS.totalGuru,
            hadirHariIni: atts.filter(x => ['hadir'].includes(x.status)).length || DUMMY_STATS.hadirHariIni,
            tidakHadir: atts.filter(x => x.status === 'tidak_hadir').length || DUMMY_STATS.tidakHadir,
            terlambat: atts.filter(x => x.status === 'terlambat').length || DUMMY_STATS.terlambat,
            izin: atts.filter(x => ['izin', 'sakit', 'cuti'].includes(x.status)).length || DUMMY_STATS.izin,
            tidakValid: 7 // Dummy fix
          });
        }

        // 2. Update Line Chart Data (7 Hari Terakhir)
        if (weekRes.data && weekRes.data.length > 0) {
            const chartMap = new Map(last7Days.map(date => [
                date, 
                { 
                  label: new Date(date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'}),
                  hadir: 0, terlambat: 0, absen: 0 
                }
            ]));

            weekRes.data.forEach(att => {
               if (chartMap.has(att.date)) {
                   const day = chartMap.get(att.date)!;
                   if (att.status === 'hadir') day.hadir++;
                   else if (att.status === 'terlambat') day.terlambat++;
                   else if (att.status === 'tidak_hadir') day.absen++;
               }
            });
            setLineData(Array.from(chartMap.values()));
        }

      } catch (error) {
        console.log("Menggunakan data dummy untuk grafik");
      }
    }
    loadData();
  }, []);

  // --- LOGIKA MATE-MATIKA GRAFIK GARIS (LINE CHART) ---
  const lineChartHeight = 150;
  const lineChartWidth = 400;
  const maxLineVal = Math.max(...lineData.flatMap(d => [d.hadir, d.terlambat, d.absen]), 100);
  const xStep = lineChartWidth / (lineData.length - 1 || 1);

  // Fungsi membuat garis lengkung utama (Bezier Curve)
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

  // Fungsi membuat area isi (Gradient) yang menutup ke bawah sumbu X
  const getFillAreaPath = (dataKey: 'hadir' | 'terlambat' | 'absen') => {
      const linePath = getSmoothPath(dataKey);
      return `${linePath} L ${lineChartWidth} ${lineChartHeight} L 0 ${lineChartHeight} Z`;
  };

  // --- LOGIKA MATE-MATIKA GRAFIK RADAR ---
  const radarCenter = 100;
  const radarRadius = 70;
  const angleStep = (Math.PI * 2) / Math.max(radarData.length, 1);

  const getRadarPoint = (val: number, i: number, max: number = 100) => {
      const r = (val / max) * radarRadius;
      const theta = i * angleStep - Math.PI / 2; // Mulai dari atas (jam 12)
      return { x: radarCenter + r * Math.cos(theta), y: radarCenter + r * Math.sin(theta) };
  };

  // --- HANDLER TOOLTIP MOUSE ---
  const handleMouseMove = (e: React.MouseEvent, title: string, label: string, value: string | number, color: string) => {
      setTooltip({ show: true, x: e.clientX, y: e.clientY, title, label, value: String(value), color });
  };
  const hideTooltip = () => setTooltip({ ...tooltip, show: false });

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-10 relative">
      
      {/* TOOLTIP PORTAL (Akan mengikuti posisi kursor) */}
      {tooltip.show && (
          <div 
             className="fixed z-50 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-[120%] transition-opacity duration-150"
             style={{ left: tooltip.x, top: tooltip.y }}
          >
             <p className="text-[11px] text-gray-300 font-medium mb-1 border-b border-gray-700 pb-1">{tooltip.title}</p>
             <div className="flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: tooltip.color }}></span>
                 <p className="text-sm font-bold">{tooltip.label}: <span className="font-normal">{tooltip.value}</span></p>
             </div>
          </div>
      )}

      <div className="px-8 pt-8 space-y-6">
        
        {/* ROW 1: STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <p className="text-[13px] font-semibold text-gray-800 mb-3">Total Guru</p>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-gray-900" />
                <span className="text-2xl font-bold text-gray-900">{stats.totalGuru}</span>
              </div>
              <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <p className="text-[13px] font-semibold text-gray-800 mb-3">Hadir Hari Ini</p>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-gray-900 fill-gray-900" />
                <span className="text-2xl font-bold text-[#22c55e]">{stats.hadirHariIni}</span>
              </div>
              <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <p className="text-[13px] font-semibold text-gray-800 mb-3">Tidak Hadir</p>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                <span className="text-2xl font-bold text-[#ef4444]">{stats.tidakHadir}</span>
              </div>
              <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <p className="text-[13px] font-semibold text-gray-800 mb-3">Terlambat</p>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                <span className="text-2xl font-bold text-[#eab308]">{stats.terlambat}</span>
              </div>
              <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <p className="text-[13px] font-semibold text-gray-800 mb-3">Izin</p>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                <span className="text-2xl font-bold text-[#3b82f6]">{stats.izin}</span>
              </div>
              <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <p className="text-[13px] font-semibold text-gray-800 mb-3">Lokasi Tidak Valid</p>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                <span className="text-2xl font-bold text-[#6366f1]">{stats.tidakValid}</span>
              </div>
              <span className="text-[10px] font-bold text-[#1e3a8a] mb-1">orang (%)</span>
            </div>
          </div>
        </div>

        {/* ROW 2: CHARTS & WARNINGS */}
        <div className="grid grid-cols-1 xl:grid-cols-[2.5fr_1.5fr_1.5fr] gap-6">
            
            {/* GRAFIK 1: Rekap Kehadiran (Interactive Line Chart WITH GRADIENT) */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] relative overflow-hidden">
                <h3 className="text-[14px] font-bold text-[#1e3a8a] mb-4">Rekap Kehadiran (7 Hari terakhir)</h3>
                <div className="h-48 w-full mt-6 relative">
                    <svg viewBox="-10 -10 420 180" className="w-full h-full overflow-visible">
                        
                        {/* DEKLARASI GRADIENT WARNA (Efek Cahaya/Glow) */}
                        <defs>
                            <linearGradient id="glowBlue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="glowGreen" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2"/>
                                <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                            </linearGradient>
                            <linearGradient id="glowOrange" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#f97316" stopOpacity="0.2"/>
                                <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                            </linearGradient>
                        </defs>

                        {/* Garis Latar (Grid Y) */}
                        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                           const y = lineChartHeight * ratio;
                           const label = Math.round(maxLineVal * (1 - ratio));
                           return (
                             <g key={`gridY-${y}`}>
                               <line x1="0" y1={y} x2={lineChartWidth} y2={y} stroke="#f3f4f6" strokeWidth="1"/>
                               <text x="-15" y={y + 3} fontSize="8" fill="#9ca3af" textAnchor="end">{label}</text>
                             </g>
                           )
                        })}

                        {/* Garis Latar (Grid X & Label Bawah) */}
                        {lineData.map((d, i) => (
                           <text key={`gridX-${d.label}`} x={i * xStep} y={lineChartHeight + 20} fontSize="8" fill="#9ca3af" textAnchor="middle">{d.label}</text>
                        ))}

                        {/* RENDER EFEK CAHAYA (Isi Bawah Garis) */}
                        <path d={getFillAreaPath('absen')} fill="url(#glowBlue)" />
                        <path d={getFillAreaPath('hadir')} fill="url(#glowGreen)" />
                        <path d={getFillAreaPath('terlambat')} fill="url(#glowOrange)" />

                        {/* RENDER GARIS UTAMA */}
                        <path d={getSmoothPath('absen')} fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                        <path d={getSmoothPath('hadir')} fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        <path d={getSmoothPath('terlambat')} fill="none" stroke="#f97316" strokeWidth="1.5" />

                        {/* Titik Hover Interaktif (Dengan stroke putih seperti di gambar) */}
                        {lineData.map((d, i) => {
                           const x = i * xStep;
                           const yHadir = lineChartHeight - (d.hadir / maxLineVal) * lineChartHeight;
                           const yTerlambat = lineChartHeight - (d.terlambat / maxLineVal) * lineChartHeight;
                           const yAbsen = lineChartHeight - (d.absen / maxLineVal) * lineChartHeight;

                           return (
                             <g key={`points-${i}`}>
                               {/* Hover Biru */}
                               <circle cx={x} cy={yAbsen} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[5px] transition-all duration-200"
                                  onMouseEnter={(e) => handleMouseMove(e, d.label, 'Tidak Hadir/Absen', d.absen, '#3b82f6')} onMouseLeave={hideTooltip} />
                               {/* Hover Hijau */}
                               <circle cx={x} cy={yHadir} r="3.5" fill="#22c55e" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[5px] transition-all duration-200"
                                  onMouseEnter={(e) => handleMouseMove(e, d.label, 'Hadir', d.hadir, '#22c55e')} onMouseLeave={hideTooltip} />
                               {/* Hover Orange */}
                               <circle cx={x} cy={yTerlambat} r="3.5" fill="#f97316" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[5px] transition-all duration-200"
                                  onMouseEnter={(e) => handleMouseMove(e, d.label, 'Terlambat', d.terlambat, '#f97316')} onMouseLeave={hideTooltip} />
                             </g>
                           )
                        })}
                    </svg>
                </div>
                <div className="absolute bottom-4 left-6">
                    <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                </div>
            </div>

            {/* GRAFIK 2: Presentasi Kehadiran (Interactive Radar Chart) */}
            <div className="bg-white rounded-xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col items-center">
                <h3 className="text-[14px] font-bold text-[#1e3a8a] w-full mb-2">Presentasi Kehadiran hari ini</h3>
                <div className="flex items-center gap-4 text-[9px] font-semibold text-gray-500 mb-4">
                    <div className="flex items-center gap-1"><span className="w-6 h-2 bg-[#3b82f6] rounded-sm"></span> Alokasi Max</div>
                    <div className="flex items-center gap-1"><span className="w-6 h-2 bg-[#22c55e] rounded-sm"></span> Aktual Hadir</div>
                </div>
                
                <div className="flex-1 w-full flex items-center justify-center relative mt-2">
                    <svg viewBox="0 0 200 200" className="w-full max-w-[180px] h-full overflow-visible">
                        {/* Jaring Laba-laba (Grid) */}
                        {[0.3, 0.6, 1].map(scale => (
                           <polygon key={scale} 
                              points={radarData.map((_, i) => {
                                 const p = getRadarPoint(100 * scale, i); return `${p.x},${p.y}`;
                              }).join(' ')} 
                              fill="none" stroke="#e5e7eb" strokeWidth="1"
                           />
                        ))}
                        {/* Garis Tulang (Axes) */}
                        {radarData.map((_, i) => {
                           const p = getRadarPoint(100, i);
                           return <line key={`axis-${i}`} x1={radarCenter} y1={radarCenter} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1"/>
                        })}

                        {/* Label Departemen / Mapel */}
                        {radarData.map((d, i) => {
                           const p = getRadarPoint(135, i); // Dorong label agak keluar
                           return (
                               <text key={`label-${d.subject}`} x={p.x} y={p.y} fontSize="7" fill="#9ca3af" 
                                     textAnchor={p.x < 90 ? 'end' : p.x > 110 ? 'start' : 'middle'} 
                                     dominantBaseline="middle">
                                   {d.subject}
                               </text>
                           )
                        })}

                        {/* Area Polygon Biru (Alokasi) */}
                        <polygon 
                           points={radarData.map((d, i) => { const p = getRadarPoint(d.alokasi, i); return `${p.x},${p.y}`; }).join(' ')} 
                           fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1.5" 
                        />
                        {/* Area Polygon Hijau (Aktual) */}
                        <polygon 
                           points={radarData.map((d, i) => { const p = getRadarPoint(d.aktual, i); return `${p.x},${p.y}`; }).join(' ')} 
                           fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" strokeWidth="1.5" 
                        />

                        {/* Titik Hover Interaktif Radar */}
                        {radarData.map((d, i) => {
                           const pAktual = getRadarPoint(d.aktual, i);
                           const pAlokasi = getRadarPoint(d.alokasi, i);
                           return (
                               <g key={`radar-points-${i}`}>
                                   <circle cx={pAlokasi.x} cy={pAlokasi.y} r="4" fill="transparent" className="cursor-pointer"
                                      onMouseEnter={(e) => handleMouseMove(e, d.subject, 'Alokasi Max', d.alokasi, '#3b82f6')} onMouseLeave={hideTooltip} />
                                   <circle cx={pAktual.x} cy={pAktual.y} r="3.5" fill="#22c55e" stroke="white" strokeWidth="1.5" className="cursor-pointer hover:r-[5px] transition-all"
                                      onMouseEnter={(e) => handleMouseMove(e, d.subject, 'Aktual Hadir', d.aktual, '#22c55e')} onMouseLeave={hideTooltip} />
                               </g>
                           )
                        })}
                    </svg>
                </div>
            </div>

            {/* Perlu Perhatian (Alerts Card) */}
            <div className="bg-[#fdf2f2] rounded-xl p-6 shadow-[0_2px_15px_-3px_rgba(239,68,68,0.2)] border border-red-100 flex flex-col">
                <div className="bg-white rounded-lg p-5 flex-1 shadow-sm border border-red-50 flex flex-col">
                    <h3 className="text-[16px] font-bold text-[#ef4444] mb-5 flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 fill-[#ef4444] text-white" /> 
                        Perlu Perhatian
                    </h3>
                    <div className="space-y-4 flex-1">
                        <div className="flex items-start justify-between group cursor-pointer">
                            <div className="flex items-start gap-3">
                                <span className="text-red-400 font-bold text-sm mt-0.5">•</span>
                                <div><p className="text-[12px] font-semibold text-gray-800">6 guru absen di luar radius sekolah</p><p className="text-[10px] text-gray-500">lihat detail untuk validasi</p></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 mt-1 group-hover:text-gray-600 transition-colors" />
                        </div>
                        <div className="flex items-start justify-between group cursor-pointer">
                            <div className="flex items-start gap-3">
                                <FileText className="w-4 h-4 text-[#eab308] mt-0.5" />
                                <div><p className="text-[12px] font-semibold text-gray-800">3 guru belum absen masuk</p><p className="text-[10px] text-gray-500">Periksa daftar absensi hari ini</p></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 mt-1 group-hover:text-gray-600 transition-colors" />
                        </div>
                        <div className="flex items-start justify-between group cursor-pointer">
                            <div className="flex items-start gap-3">
                                <span className="w-4"></span>
                                <div><p className="text-[12px] font-semibold text-gray-800">2 Pengajuan Izin menunggu persetujuan</p><p className="text-[10px] text-gray-500">Tindak lanjuti sekarang</p></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 mt-1 group-hover:text-gray-600 transition-colors" />
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button className="text-[11px] font-semibold text-[#ef4444] hover:underline flex items-center gap-1">Lihat semua <ChevronRight className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

        </div>

        {/* ROW 3: TABEL & AKTIVITAS */}
        <div className="grid grid-cols-1 xl:grid-cols-[2.5fr_1fr] gap-6">
            
            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="text-[14px] font-bold text-[#1e3a8a]">Absensi Terbaru Hari Ini</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-[12px]">
                        <thead className="bg-[#f8fafc] text-gray-700 font-semibold border-b border-gray-100">
                            <tr>
                                <th className="px-5 py-3 w-12">No</th>
                                <th className="px-5 py-3">Nama Guru</th>
                                <th className="px-5 py-3">Foto</th>
                                <th className="px-5 py-3">Jabatan</th>
                                <th className="px-5 py-3">Jam Masuk</th>
                                <th className="px-5 py-3">Jam Pulang</th>
                                <th className="px-5 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                            {/* Dummy rendering */}
                            <tr className="hover:bg-gray-50 transition-colors"><td className="px-5 py-4">1</td><td className="px-5 py-4">Jamal</td><td className="px-5 py-4"><img src="https://i.pravatar.cc/150?img=11" alt="Jamal" className="w-7 h-7 rounded object-cover" /></td><td className="px-5 py-4">Guru Informatika</td><td className="px-5 py-4">07.20</td><td className="px-5 py-4">15.30</td><td className="px-5 py-4 font-bold text-[#22c55e]">Hadir</td></tr>
                            <tr className="hover:bg-gray-50 transition-colors"><td className="px-5 py-4">2</td><td className="px-5 py-4">Anton</td><td className="px-5 py-4"></td><td className="px-5 py-4">Guru Indonesia</td><td className="px-5 py-4">07.25</td><td className="px-5 py-4">-</td><td className="px-5 py-4 font-bold text-[#22c55e]">Hadir</td></tr>
                            <tr className="hover:bg-gray-50 transition-colors"><td className="px-5 py-4">3</td><td className="px-5 py-4">Jeno</td><td className="px-5 py-4"></td><td className="px-5 py-4">Guru PKN</td><td className="px-5 py-4">08.05</td><td className="px-5 py-4">-</td><td className="px-5 py-4 font-bold text-[#eab308]">Terlambat</td></tr>
                            <tr className="hover:bg-gray-50 transition-colors"><td className="px-5 py-4">4</td><td className="px-5 py-4">Naila</td><td className="px-5 py-4"></td><td className="px-5 py-4">Guru Matematika</td><td className="px-5 py-4">07.27</td><td className="px-5 py-4">16.00</td><td className="px-5 py-4 font-bold text-[#22c55e]">Hadir</td></tr>
                            <tr className="hover:bg-gray-50 transition-colors"><td className="px-5 py-4">5</td><td className="px-5 py-4">Karina</td><td className="px-5 py-4"></td><td className="px-5 py-4">Guru Fisika</td><td className="px-5 py-4">-</td><td className="px-5 py-4">-</td><td className="px-5 py-4 font-bold text-[#ef4444]">Tidak Hadir</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-6">
                <h3 className="text-[14px] font-bold text-gray-900 mb-6">Aktivitas terbaru</h3>
                <div className="space-y-6">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                            <div><p className="text-[12px] font-semibold text-gray-800">Naila mengajukan izin</p><p className="text-[10px] text-gray-500 mt-0.5">Izin sakit - 11 Mei 2026</p></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium shrink-0 mt-0.5">07.20</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                            <FileText className="w-4 h-4 text-[#eab308] mt-0.5 shrink-0" />
                            <div><p className="text-[12px] font-semibold text-gray-800">Jeno absen masuk</p><p className="text-[10px] text-gray-500 mt-0.5">11 Mei 2026 - 07:20</p></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium shrink-0 mt-0.5">07.20</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                            <div><p className="text-[12px] font-semibold text-gray-800">Jamal absen pulang</p><p className="text-[10px] text-gray-500 mt-0.5">10 Mei 2026 - 15.00</p></div>
                        </div>
                        <span className="text-[10px] text-gray-500 font-medium shrink-0 mt-0.5">15.00</span>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}