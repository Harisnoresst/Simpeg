import { useEffect, useState } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  LogIn, 
  LogOut, 
  Monitor, 
  FileX, 
  History, 
  ClipboardList 
} from 'lucide-react';
import api from '../../lib/axios'; 
import { useAuth } from '../../contexts/AuthContext';

type Page = 'absensi' | 'riwayat' | 'izin-cuti';

type Props = {
  onNavigate: (page: Page) => void;
};

type Attendance = {
  id: number;
  user_id: number;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
};

type School = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  allowed_radius_meters: number;
};

type SettingsData = {
  nama_instansi: string;
  latitude: number | null;
  longitude: number | null;
  radius_lokasi: number;
  validasi_lokasi: boolean | number;
};

export default function DashboardGuru({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  
  const [school, setSchool] = useState<School | null>(null);
  const [appSettings, setAppSettings] = useState<SettingsData | null>(null);
  
  const [weekSummary, setWeekSummary] = useState({ hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 }); 
  const [currentTime, setCurrentTime] = useState(new Date()); 
  const [distance, setDistance] = useState<number | null>(null);
  
  // PERBAIKAN 1: Default loading diubah jadi true, dan akan dipaksa false di akhir fungsi
  const [isLoading, setIsLoading] = useState(true);

  const formatDay = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long' });
  const formatDateFull = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  useEffect(() => {
    const targetLat = appSettings?.latitude || school?.latitude;
    const targetLng = appSettings?.longitude || school?.longitude;

    if (targetLat && targetLng) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const dist = calculateDistance(userLat, userLng, targetLat, targetLng);
            setDistance(dist);
          },
          (error) => console.error("Gagal mendapatkan lokasi:", error),
          { enableHighAccuracy: true } 
        );
      }
    }
  }, [appSettings, school]);

  async function loadData() {
    setIsLoading(true);

    try {
      const dashRes = await api.get('/dashboard');
      if (dashRes.data.today_attendance) setTodayAttendance(dashRes.data.today_attendance);
      if (dashRes.data.week_summary) setWeekSummary(dashRes.data.week_summary);
      if (dashRes.data.school) setSchool(dashRes.data.school);
    } catch (error) {
      console.error("Gagal memuat data dashboard:", error);
    }

    
    try {
      const setRes = await api.get('/settings');
      if (setRes.data) setAppSettings(setRes.data);
    } catch (error) {
      console.error("Gagal memuat data settings (mungkin butuh akses admin):", error);
    }

    setIsLoading(false); // Memaksa tulisan "Mendeteksi..." hilang apapun yang terjadi
  }

  const getStatusBadge = () => {
    if (!todayAttendance) return { text: 'BELUM ABSEN', color: 'bg-red-50 text-red-600' };
    switch (todayAttendance.status) {
      case 'hadir': return { text: 'HADIR', color: 'bg-green-50 text-green-600' };
      case 'terlambat': return { text: 'TERLAMBAT', color: 'bg-yellow-50 text-yellow-600' };
      case 'izin':
      case 'sakit':
      case 'cuti': return { text: todayAttendance.status.toUpperCase(), color: 'bg-blue-50 text-blue-600' };
      default: return { text: 'TIDAK HADIR', color: 'bg-red-50 text-red-600' };
    }
  };

  const statusBadge = getStatusBadge();

  const activeRadius = appSettings?.radius_lokasi ?? school?.allowed_radius_meters;
  const isLocationValidationActive = appSettings?.validasi_lokasi === 1 || appSettings?.validasi_lokasi === true;
  const isOutOfRadius = distance !== null && activeRadius !== undefined && distance > activeRadius;
  const isButtonDisabledByLocation = isLocationValidationActive && isOutOfRadius;

  const namaSekolah = appSettings?.nama_instansi || school?.name || 'Instansi Belum Diatur';

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 sm:p-8 font-sans">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium mb-1">Selamat pagi,</p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{profile?.name || 'Jamal'}</h2>
          <p className="text-gray-500 text-sm">{profile?.subject || 'Guru Informatika'}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium mb-1">Tanggal</p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{formatDateFull(currentTime)}</h2>
          <p className="text-gray-500 text-sm">{formatDay(currentTime)}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative">
          <p className="text-gray-900 font-medium mb-1">Jam Sekarang</p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{formatTime(currentTime)}</h2>
          <Clock className="absolute top-5 right-5 w-6 h-6 text-gray-400 stroke-[1.5]" />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium mb-2">Status Hari Ini</p>
          <div className={`${statusBadge.color} text-[10px] font-bold px-3 py-1.5 rounded w-max mb-2 tracking-wide`}>
            {statusBadge.text}
          </div>
          <p className="text-gray-500 text-sm">
            {todayAttendance?.check_in_time ? `Absen Masuk: ${todayAttendance.check_in_time}` : 'Belum Melakukan Absensi Masuk'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Lokasi Sekolah</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {isLoading ? 'Mendeteksi Sekolah...' : namaSekolah}
              </p>
              
              <p className="text-sm text-gray-600 mt-1 mb-3">
                Jarak Anda ke sekolah: {distance !== null ? `${distance} Meter` : (isLoading ? 'Mendeteksi...' : 'Lokasi GPS belum tersedia')}
              </p>
              
              {activeRadius ? (
                <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded ${
                  !isLocationValidationActive || (distance !== null && distance <= activeRadius)
                    ? 'bg-[#e6ffe6] text-green-600' 
                    : 'bg-[#ffebea] text-red-600'   
                }`}>
                  {!isLocationValidationActive 
                    ? 'Validasi GPS Dinonaktifkan'
                    : distance !== null && distance <= activeRadius
                    ? `Dalam radius (${activeRadius} Meter)`
                    : `Di luar radius (${activeRadius} Meter)`
                  }
                </span>
              ) : (
                <span className="inline-block bg-gray-100 text-gray-500 text-xs font-medium px-3 py-1.5 rounded">
                  Belum di set euy sama si admin jaraknya....
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Aksi Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('absensi')}
              disabled={!!todayAttendance?.check_in_time || isButtonDisabledByLocation}
              className="flex items-center gap-4 p-4 bg-[#eaffea] hover:bg-[#dfffdf] disabled:opacity-60 border border-[#bbf7d0] rounded-xl text-left transition-colors"
            >
              <div className="w-10 h-10 border-2 border-green-600 rounded-lg flex items-center justify-center shrink-0">
                <LogIn className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-600">Absen Masuk</p>
                <p className="text-xs text-gray-600 mt-0.5">Catat kehadiran masuk</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('absensi')}
              disabled={!todayAttendance?.check_in_time || !!todayAttendance?.check_out_time || isButtonDisabledByLocation}
              className="flex items-center gap-4 p-4 bg-[#ffebea] hover:bg-[#ffe0df] disabled:opacity-60 border border-[#fecaca] rounded-xl text-left transition-colors"
            >
              <div className="w-10 h-10 border-2 border-red-600 rounded-lg flex items-center justify-center shrink-0">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-600">Absen Pulang</p>
                <p className="text-xs text-gray-600 mt-0.5">Catat kehadiran pulang</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Informasi</h3>
          <ul className="space-y-4 text-sm text-gray-600">
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /><span>Pastikan Anda Berada di Area sekolah saat melakukan absensi</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /><span>Ambil foto selfie dengan jelas</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" /><span>Jika ada kendala, hubungi administrator sekolah</span></li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Ringkasan Minggu Ini</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-green-600 font-semibold text-sm mb-2">Hadir</p><p className="text-3xl font-bold text-green-600">{weekSummary.hadir}</p><Monitor className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-red-600 font-semibold text-sm mb-2">Tidak Hadir</p><p className="text-3xl font-bold text-red-600">{weekSummary.tidakHadir}</p><FileX className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-yellow-400 font-semibold text-sm mb-2">Terlambat</p><p className="text-3xl font-bold text-yellow-400">{weekSummary.terlambat}</p><History className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-blue-600 font-semibold text-sm mb-2">Izin</p><p className="text-3xl font-bold text-blue-600">{weekSummary.izin}</p><ClipboardList className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}