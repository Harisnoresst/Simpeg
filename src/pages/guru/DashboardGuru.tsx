import { useEffect, useState } from 'react';
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  LogIn, 
  LogOut, 
  Bell, 
  Monitor, 
  FileX, 
  History, 
  ClipboardList 
} from 'lucide-react';
import { supabase, Attendance, School } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Page = 'absensi' | 'riwayat' | 'izin-cuti';

type Props = {
  onNavigate: (page: Page) => void;
};

export default function DashboardGuru({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [weekSummary, setWeekSummary] = useState({ hadir: 4, tidakHadir: 0, terlambat: 1, izin: 0 }); 
  const [currentTime, setCurrentTime] = useState(new Date()); 
  const [distance, setDistance] = useState<number | null>(null); // State baru untuk jarak real-time

  // Fungsi formatting
  const formatDay = (d: Date) => d.toLocaleDateString('id-ID', { weekday: 'long' });
  const formatDateFull = (d: Date) => d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  const formatTime = (d: Date) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');

  // Rumus Haversine untuk menghitung jarak antara 2 titik koordinat (dalam meter)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Radius bumi dalam meter
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

  // Effect baru untuk mendapatkan lokasi user dan menghitung jarak ke sekolah
  useEffect(() => {
    if (school && school.latitude && school.longitude) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            // Hitung jarak user saat ini ke koordinat sekolah dari database
            const dist = calculateDistance(userLat, userLng, school.latitude, school.longitude);
            setDistance(dist);
          },
          (error) => {
            console.error("Gagal mendapatkan lokasi:", error);
          },
          { enableHighAccuracy: true } // Akurasi tinggi untuk GPS Absensi
        );
      }
    }
  }, [school]);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];

    const [attRes, schoolRes] = await Promise.all([
      supabase.from('attendances').select('*').eq('user_id', profile!.id).eq('date', today).maybeSingle(),
      profile?.school_id
        ? supabase.from('schools').select('*').eq('id', profile.school_id).maybeSingle()
        : supabase.from('schools').select('*').limit(1).maybeSingle(),
    ]);

    if (attRes.data) setTodayAttendance(attRes.data);
    if (schoolRes.data) setSchool(schoolRes.data);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const { data: weekData } = await supabase
      .from('attendances')
      .select('status')
      .eq('user_id', profile!.id)
      .gte('date', startOfWeek.toISOString().split('T')[0]);

    if (weekData && weekData.length > 0) {
      const summary = { hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 };
      weekData.forEach(a => {
        if (a.status === 'hadir') summary.hadir++;
        else if (a.status === 'tidak_hadir') summary.tidakHadir++;
        else if (a.status === 'terlambat') summary.terlambat++;
        else if (a.status === 'izin' || a.status === 'sakit' || a.status === 'cuti') summary.izin++;
      });
      setWeekSummary(summary);
    }
  }

  const status = todayAttendance?.status || 'belum_absen';

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-6 sm:p-8 font-sans">

      {/* Baris 1: 4 Kartu Informasi Cepat */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Card 1: Profil Singkat */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium mb-1">Selamat pagi,</p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{profile?.full_name || 'Jamal'}</h2>
          <p className="text-gray-500 text-sm">{profile?.subject || 'Guru Informatika'}</p>
        </div>

        {/* Card 2: Tanggal */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium mb-1">Tanggal</p>
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">{formatDateFull(currentTime)}</h2>
          <p className="text-gray-500 text-sm">{formatDay(currentTime)}</p>
        </div>

        {/* Card 3: Jam Sekarang */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative">
          <p className="text-gray-900 font-medium mb-1">Jam Sekarang</p>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{formatTime(currentTime)}</h2>
          <Clock className="absolute top-5 right-5 w-6 h-6 text-gray-400 stroke-[1.5]" />
        </div>

        {/* Card 4: Status */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium mb-2">Status Hari Ini</p>
          <div className="bg-red-50 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded w-max mb-2 tracking-wide">
            BELUM ABSEN
          </div>
          <p className="text-gray-500 text-sm">Belum Melakukan Absensi Masuk</p>
        </div>

      </div>

      {/* Baris 2: Lokasi & Aksi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Card Lokasi Sekolah */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Lokasi Sekolah</h3>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{school?.name || 'SMAN 1 Rancaekek'}</p>
              
              {/* Jarak dinamis menggunakan GPS */}
              <p className="text-sm text-gray-600 mt-1 mb-3">
                Jarak Anda ke sekolah: {distance !== null ? `${distance} Meter` : 'Mendeteksi...'}
              </p>
              
              {/* Indikator dinamis: Menggunakan allowed_radius dari DB & Jarak Aktual */}
              {school?.allowed_radius_meters ? (
                <span className={`inline-block text-xs font-medium px-3 py-1.5 rounded ${
                  distance !== null && distance <= school.allowed_radius_meters
                    ? 'bg-[#e6ffe6] text-green-600' 
                    : 'bg-[#ffebea] text-red-600'   
                }`}>
                  {distance !== null && distance <= school.allowed_radius_meters
                    ? `Dalam radius (${school.allowed_radius_meters} Meter)`
                    : `Di luar radius (${school.allowed_radius_meters} Meter)`
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

        {/* Card Aksi Cepat */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Aksi Cepat</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate('absensi')}
              // Validasi tambahan: tombol disable jika di luar radius
              disabled={!!todayAttendance?.check_in_time || (distance !== null && school?.allowed_radius_meters !== undefined && distance > school.allowed_radius_meters)}
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
              disabled={!todayAttendance?.check_in_time || !!todayAttendance?.check_out_time || (distance !== null && school?.allowed_radius_meters !== undefined && distance > school.allowed_radius_meters)}
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

      {/* Baris 3: Informasi & Ringkasan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card Informasi */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Informasi</h3>
          <ul className="space-y-4 text-sm text-gray-600">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <span>Pastikan Anda Berada di Area sekolah saat melakukan absensi</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <span>Ambil foto selfie dengan jelas</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
              <span>Jika ada kendala, hubungi administrator sekolah</span>
            </li>
          </ul>
        </div>

        {/* Card Ringkasan Minggu Ini */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-gray-900 mb-5">Ringkasan Minggu Ini</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Hadir */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
              <p className="text-green-600 font-semibold text-sm mb-2">Hadir</p>
              <p className="text-3xl font-bold text-green-600">{weekSummary.hadir}</p>
              <Monitor className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
            </div>

            {/* Tidak Hadir */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
              <p className="text-red-600 font-semibold text-sm mb-2">Tidak Hadir</p>
              <p className="text-3xl font-bold text-red-600">{weekSummary.tidakHadir}</p>
              <FileX className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
            </div>

            {/* Terlambat */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
              <p className="text-yellow-400 font-semibold text-sm mb-2">Terlambat</p>
              <p className="text-3xl font-bold text-yellow-400">{weekSummary.terlambat}</p>
              <History className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
            </div>

            {/* Izin */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
              <p className="text-blue-600 font-semibold text-sm mb-2">Izin</p>
              <p className="text-3xl font-bold text-blue-600">{weekSummary.izin}</p>
              <ClipboardList className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}