import { useEffect, useState } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, MapPin, ClipboardCheck, LogOut } from 'lucide-react';
import { supabase, Attendance, School } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

type Page = 'absensi' | 'riwayat' | 'izin-cuti';

type Props = {
  onNavigate: (page: Page) => void;
};

const STATUS_COLORS: Record<string, string> = {
  hadir: 'text-green-600 bg-green-50',
  terlambat: 'text-yellow-600 bg-yellow-50',
  tidak_hadir: 'text-red-600 bg-red-50',
  izin: 'text-blue-600 bg-blue-50',
  sakit: 'text-orange-600 bg-orange-50',
  cuti: 'text-gray-600 bg-gray-100',
  belum_absen: 'text-gray-500 bg-gray-50',
};

const STATUS_LABELS: Record<string, string> = {
  hadir: 'Hadir',
  terlambat: 'Terlambat',
  tidak_hadir: 'Tidak Hadir',
  izin: 'Izin',
  sakit: 'Sakit',
  cuti: 'Cuti',
  belum_absen: 'BELUM ABSEN',
};

export default function DashboardGuru({ onNavigate }: Props) {
  const { profile } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [weekSummary, setWeekSummary] = useState({ hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  async function loadData() {
    const today = new Date().toISOString().split('T')[0];

    const [attRes, schoolRes] = await Promise.all([
      supabase.from('attendances').select('*').eq('user_id', profile!.id).eq('date', today).maybeSingle(),
      profile?.school_id
        ? supabase.from('schools').select('*').eq('id', profile.school_id).maybeSingle()
        : supabase.from('schools').select('*').limit(1).maybeSingle(),
    ]);

    setTodayAttendance(attRes.data);
    setSchool(schoolRes.data);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const { data: weekData } = await supabase
      .from('attendances')
      .select('status')
      .eq('user_id', profile!.id)
      .gte('date', startOfWeek.toISOString().split('T')[0]);

    if (weekData) {
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

  const formatDate = (d: Date) =>
    d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const status = todayAttendance?.status || 'belum_absen';

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm">Selamat pagi,</p>
            <h2 className="text-2xl font-bold">{profile?.full_name || 'Guru'}</h2>
            <p className="text-blue-200 text-sm">{profile?.subject || 'Guru'}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-blue-200 text-xs mb-1">Tanggal</p>
              <p className="font-semibold text-sm">{formatDate(currentTime)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-xs mb-1 flex items-center gap-1 justify-center">
                <Clock className="w-3 h-3" /> Jam Sekarang
              </p>
              <p className="font-bold text-lg font-mono">{formatTime(currentTime)}</p>
            </div>
            <div className="text-center">
              <p className="text-blue-200 text-xs mb-1">Status Hari Ini</p>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                status === 'belum_absen' ? 'bg-red-500 text-white' :
                status === 'hadir' ? 'bg-green-400 text-white' :
                'bg-yellow-400 text-gray-900'
              }`}>
                {STATUS_LABELS[status]}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            Lokasi Sekolah
          </h3>
          {school ? (
            <div className="space-y-2">
              <p className="font-medium text-gray-800">{school.name}</p>
              <p className="text-sm text-gray-500">{school.address}</p>
              <div className="flex gap-4 mt-3">
                <div className="bg-blue-50 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-xs text-gray-500">Radius Absen</p>
                  <p className="font-bold text-blue-700">{school.allowed_radius_meters}m</p>
                </div>
                <div className="bg-green-50 rounded-lg px-3 py-2 text-center flex-1">
                  <p className="text-xs text-gray-500">Koordinat</p>
                  <p className="font-bold text-green-700 text-xs">{school.latitude.toFixed(4)}, {school.longitude.toFixed(4)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Belum ada sekolah terdaftar</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('absensi')}
              disabled={!!todayAttendance?.check_in_time}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-green-200 transition-colors"
            >
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-green-700">Absen Masuk</span>
              <span className="text-xs text-green-600">
                {todayAttendance?.check_in_time ? `Sudah: ${todayAttendance.check_in_time}` : 'Tidak terlambat lagi'}
              </span>
            </button>
            <button
              onClick={() => onNavigate('absensi')}
              disabled={!todayAttendance?.check_in_time || !!todayAttendance?.check_out_time}
              className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-red-200 transition-colors"
            >
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <LogOut className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-red-700">Absen Pulang</span>
              <span className="text-xs text-red-600">
                {todayAttendance?.check_out_time ? `Sudah: ${todayAttendance.check_out_time}` : 'Catat kehadiran pulang'}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Informasi</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              Pastikan Anda berada di area sekolah saat absen
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              Absen masuk sebelum pukul 07:30 WIB
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              Foto selfie harus menampilkan wajah dengan jelas
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              Absen pulang tidak dapat dilakukan sebelum absen masuk
            </li>
            <li className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              Absen di luar radius sekolah tidak akan diterima
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4">Ringkasan Minggu Ini</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Hadir', value: weekSummary.hadir, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
              { label: 'Tidak Hadir', value: weekSummary.tidakHadir, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
              { label: 'Terlambat', value: weekSummary.terlambat, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertCircle },
              { label: 'Izin', value: weekSummary.izin, color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                  <Icon className={`w-5 h-5 ${item.color} mx-auto mb-1`} />
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                </div>
              );
            })}
          </div>

          {todayAttendance && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Detail Hari Ini</p>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Masuk: </span>
                  <span className="font-medium text-gray-800">{todayAttendance.check_in_time || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Pulang: </span>
                  <span className="font-medium text-gray-800">{todayAttendance.check_out_time || '-'}</span>
                </div>
                <div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[todayAttendance.status]}`}>
                    {STATUS_LABELS[todayAttendance.status]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
