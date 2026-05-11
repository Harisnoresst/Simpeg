import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Camera, CheckCircle, XCircle, RefreshCw,
  AlertTriangle, Loader2, Clock
} from 'lucide-react';
import { supabase, Attendance, School } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { haversineDistance, getCurrentPosition } from '../../lib/geo';

type Mode = 'masuk' | 'pulang';

export default function AbsensiPage() {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [school, setSchool] = useState<School | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [mode, setMode] = useState<Mode>('masuk');

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locationValid, setLocationValid] = useState<boolean | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  const [photo, setPhoto] = useState<string>('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (profile) loadInitialData();
    return () => stopCamera();
  }, [profile]);

  // FIX LAYAR HITAM: Memasukkan stream ke dalam video *setelah* elemen video di-render oleh React
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  async function loadInitialData() {
    const today = new Date().toISOString().split('T')[0];
    const [attRes, schoolRes] = await Promise.all([
      supabase.from('attendances').select('*').eq('user_id', profile!.id).eq('date', today).maybeSingle(),
      profile?.school_id
        ? supabase.from('schools').select('*').eq('id', profile.school_id).maybeSingle()
        : supabase.from('schools').select('*').limit(1).maybeSingle(),
    ]);
    setTodayAttendance(attRes.data);
    setSchool(schoolRes.data);
    if (attRes.data?.check_in_time && !attRes.data?.check_out_time) setMode('pulang');
  }

  async function getLocation() {
    setLocationLoading(true);
    setLocationError('');
    try {
      const pos = await getCurrentPosition();
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      setLat(userLat);
      setLng(userLng);

      if (school) {
        const dist = haversineDistance(userLat, userLng, school.latitude, school.longitude);
        setDistance(dist);
        setLocationValid(dist <= school.allowed_radius_meters);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Gagal mendapatkan lokasi';
      setLocationError(msg);
    } finally {
      setLocationLoading(false);
    }
  }

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      // Hapus videoRef.current logic dari sini karena element video belum ter-render
      setCameraActive(true); 
    } catch {
      setCameraError('Tidak dapat mengakses kamera.');
    }
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85);
    setPhoto(dataUrl);
    stopCamera();
  }

  function resetPhoto() {
    setPhoto('');
    startCamera();
  }

  async function handleSubmit() {
    if (!locationValid || !photo || !profile) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().split(' ')[0];
      const isLate = now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 30);

      if (mode === 'masuk') {
        const status = isLate ? 'terlambat' : 'hadir';
        const { data: existing } = await supabase
          .from('attendances')
          .select('id')
          .eq('user_id', profile.id)
          .eq('date', today)
          .maybeSingle();

        if (existing) {
          await supabase.from('attendances').update({
            check_in_time: timeStr,
            check_in_lat: lat,
            check_in_lng: lng,
            check_in_photo: photo,
            status,
            distance_check_in: distance ?? 0,
            location_valid_check_in: true,
            updated_at: now.toISOString(),
          }).eq('id', existing.id);
        } else {
          await supabase.from('attendances').insert({
            user_id: profile.id,
            date: today,
            check_in_time: timeStr,
            check_in_lat: lat,
            check_in_lng: lng,
            check_in_photo: photo,
            status,
            distance_check_in: distance ?? 0,
            location_valid_check_in: true,
          });
        }
        setSubmitSuccess(`Absen masuk berhasil! Pukul ${timeStr}`);
      } else {
        await supabase.from('attendances').update({
          check_out_time: timeStr,
          check_out_lat: lat,
          check_out_lng: lng,
          check_out_photo: photo,
          distance_check_out: distance ?? 0,
          location_valid_check_out: true,
          updated_at: now.toISOString(),
        }).eq('user_id', profile.id).eq('date', today);
        setSubmitSuccess(`Absen pulang berhasil! Pukul ${timeStr}`);
      }

      await loadInitialData();
      setPhoto('');
      setLat(null);
      setLng(null);
      setDistance(null);
      setLocationValid(null);
    } catch {
      setSubmitError('Gagal menyimpan absensi.');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = locationValid && photo && !submitting;
  const alreadyDone = mode === 'masuk'
    ? !!todayAttendance?.check_in_time
    : !!todayAttendance?.check_out_time;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Absensi</h2>
        <p className="text-sm text-gray-500">Lokasi + Selfie untuk kehadiran</p>
      </div>

      {alreadyDone && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm font-medium">
            Sudah absen {mode === 'masuk' ? 'masuk' : 'pulang'} pada pukul{' '}
            {mode === 'masuk' ? todayAttendance?.check_in_time : todayAttendance?.check_out_time}
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {(['masuk', 'pulang'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setPhoto(''); setLat(null); setLng(null); setDistance(null); setLocationValid(null); stopCamera(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              mode === m
                ? m === 'masuk' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Absen {m === 'masuk' ? 'Masuk' : 'Pulang'}
          </button>
        ))}
      </div>

      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-700 text-sm font-medium">{submitSuccess}</p>
        </div>
      )}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 text-sm">{submitError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</span>
            Lokasi Anda
          </h3>

          {locationValid === null && !locationLoading && (
            <button
              onClick={getLocation}
              className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-blue-600 font-medium text-sm">Ambil Lokasi</p>
            </button>
          )}

          {locationLoading && <div className="flex flex-col items-center gap-3 p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}

          {locationError && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-red-600 text-sm">{locationError}</p>
              </div>
              <button onClick={getLocation} className="w-full text-sm text-blue-600 hover:underline">Coba Lagi</button>
            </div>
          )}

          {locationValid !== null && !locationLoading && (
            <div className="space-y-3">
              <div className={`rounded-xl p-4 border-2 ${locationValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {locationValid ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                  <p className={`font-semibold text-sm ${locationValid ? 'text-green-700' : 'text-red-700'}`}>
                    {locationValid ? 'Lokasi Valid' : 'Lokasi Tidak Valid'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div><p className="text-gray-500">Latitude</p><p className="font-mono">{lat?.toFixed(6)}</p></div>
                  <div><p className="text-gray-500">Longitude</p><p className="font-mono">{lng?.toFixed(6)}</p></div>
                  <div><p className="text-gray-500">Jarak</p><p className={`font-bold ${locationValid ? 'text-green-600' : 'text-red-600'}`}>{distance}m</p></div>
                  <div><p className="text-gray-500">Batas</p><p className="font-medium">{school?.allowed_radius_meters}m</p></div>
                </div>
              </div>
              {!locationValid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-700 text-xs">Anda di luar area sekolah. Absensi ditolak.</p>
                </div>
              )}
              <button onClick={getLocation} className="w-full text-xs text-blue-600 hover:underline">Perbarui</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Foto Selfie
          </h3>

          {!cameraActive && !photo && (
            <button
              onClick={startCamera}
              className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="w-7 h-7 text-blue-600" />
              </div>
              <p className="text-blue-600 font-medium text-sm">Ambil Foto</p>
            </button>
          )}

          {cameraError && <div className="p-3 bg-red-50 rounded-lg border border-red-200"><p className="text-red-600 text-sm">{cameraError}</p></div>}

          {cameraActive && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden bg-black aspect-video"><video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline /></div>
              <div className="flex gap-2">
                <button onClick={capturePhoto} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">Ambil</button>
                <button onClick={stopCamera} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Batal</button>
              </div>
            </div>
          )}

          {photo && (
            <div className="space-y-3">
              <div className="rounded-xl overflow-hidden aspect-video"><img src={photo} alt="Selfie" className="w-full h-full object-cover" /></div>
              <button onClick={resetPhoto} className="w-full border border-gray-300 hover:bg-gray-50 text-gray-600 py-2 rounded-lg text-sm">Ambil Ulang</button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          Konfirmasi
        </h3>

        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className={`flex items-center gap-1 ${locationValid === true ? 'text-green-600' : 'text-gray-400'}`}>
            {locationValid === true ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            Lokasi valid
          </div>
          <div className={`flex items-center gap-1 ${photo ? 'text-green-600' : 'text-gray-400'}`}>
            {photo ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            Foto diambil
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all ${
            canSubmit
              ? mode === 'masuk'
                ? 'bg-green-600 hover:bg-green-700 shadow-md'
                : 'bg-red-600 hover:bg-red-700 shadow-md'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /></span> : `Absen ${mode === 'masuk' ? 'Masuk' : 'Pulang'}`}
        </button>

        {!locationValid && locationValid !== null && <p className="text-center text-xs text-red-500 mt-2">Lokasi tidak valid</p>}
      </div>
    </div>
  );
}