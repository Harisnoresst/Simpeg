import { useEffect, useRef, useState, useCallback } from 'react';
import {
  MapPin, Camera, CheckCircle, XCircle, RefreshCw,
  AlertTriangle, Loader2, Clock
} from 'lucide-react';
import api from '../../lib/axios'; 
import { useAuth } from '../../contexts/AuthContext';
import { haversineDistance } from '../../lib/geo';
import * as faceapi from 'face-api.js';

type Mode = 'masuk' | 'pulang';

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

export default function AbsensiPage() {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorInterval = useRef<any>(null); // Ref untuk menyimpan interval AI

  const [school, setSchool] = useState<School | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [settings, setSettings] = useState<any>(null); 
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
  
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isFaceValid, setIsFaceValid] = useState(true); 

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadAIModels = async () => {
      try {
        const MODEL_URL = '/models'; 
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        setIsModelsLoaded(true);
      } catch (err) {
        console.error("Gagal memuat model AI", err);
      }
    };
    loadAIModels();
  }, []);

  useEffect(() => {
    if (profile) loadInitialData();
    return () => stopCamera();
  }, [profile]);

  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      // Mulai deteksi wajah real-time saat kamera nyala
      startRealTimeDetection();
    }
  }, [cameraActive]);

  async function loadInitialData() {
    try {
      const [dashRes, setRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/settings')
      ]);
      setTodayAttendance(dashRes.data.today_attendance);
      setSchool(dashRes.data.school);
      setSettings(setRes.data); 
      if (dashRes.data.today_attendance?.check_in_time && !dashRes.data.today_attendance?.check_out_time) {
        setMode('pulang');
      }
    } catch (error) {
      console.error("Gagal memuat data awal:", error);
    }
  }

  // --- LOGIKA DETEKSI WAJAH REAL-TIME (BELUM DIJEPRET SUDAH TAHU) ---
  const startRealTimeDetection = () => {
    if (detectorInterval.current) clearInterval(detectorInterval.current);

    detectorInterval.current = setInterval(async () => {
      if (videoRef.current && isModelsLoaded && cameraActive) {
        const detection = await faceapi.detectSingleFace(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions()
        );

        if (!detection) {
          setCameraError('Wajah tidak terdeteksi! Harap arahkan kamera ke wajah Anda.');
          setIsFaceValid(false);
        } else {
          setCameraError(''); // Clear error jika wajah kembali terlihat
          setIsFaceValid(true);
        }
      }
    }, 800); // Cek setiap 0.8 detik (biar gak terlalu berat tapi tetep responsif)
  };

  async function getLocation() {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setLat(userLat);
        setLng(userLng);
        const targetLat = settings?.latitude ? parseFloat(settings.latitude) : school?.latitude;
        const targetLng = settings?.longitude ? parseFloat(settings.longitude) : school?.longitude;
        const radius = settings?.radius_lokasi || school?.allowed_radius_meters || 100;

        if (settings?.validasi_lokasi === 0 || settings?.validasi_lokasi === false) {
             setDistance(0); setLocationValid(true);
        } else if (targetLat && targetLng) {
             const dist = Math.round(haversineDistance(userLat, userLng, targetLat, targetLng));
             setDistance(dist); setLocationValid(dist <= radius);
        } else {
             setDistance(0); setLocationValid(true);
        }
        setLocationLoading(false);
      },
      (error) => {
        setLocationError('Gagal mendapatkan lokasi.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 } 
    );
  }

  async function startCamera() {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      setCameraActive(true); 
    } catch {
      setCameraError('Tidak dapat mengakses kamera.');
    }
  }

  const stopCamera = useCallback(() => {
    if (detectorInterval.current) clearInterval(detectorInterval.current); // Hentikan interval AI
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => { track.stop(); track.enabled = false; });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  async function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Saat jepret, kita ambil status isFaceValid yang terakhir dari interval real-time
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.85); 
        setPhoto(dataUrl);
        // isFaceValid sudah diatur oleh interval secara real-time
        stopCamera();
    }
  }

  function resetPhoto() {
    setPhoto('');
    setIsFaceValid(true); 
    startCamera();
  }

  async function handleSubmit() {
    if (!profile || lat === null || lng === null) return;
    const isPhotoRequired = settings?.foto_selfie !== 0 && settings?.foto_selfie !== false;
    if (isPhotoRequired && !photo) return;

    setSubmitting(true);
    try {
      const payload = {
        type: mode, 
        lat: lat, lng: lng,
        distance: distance ?? 0,
        photo: photo || '',
        is_face_valid: isFaceValid ? 1 : 0 
      };
      const { data } = await api.post('/attendance', payload);
      setSubmitSuccess(`Absen ${mode} berhasil! Pukul ${data.time}`);
      await loadInitialData();
      setPhoto(''); setLat(null); setLng(null); setDistance(null); setLocationValid(null);
    } catch (err: any) {
      setSubmitError('Gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  }

  const isPhotoRequired = settings?.foto_selfie !== 0 && settings?.foto_selfie !== false;
  const canSubmit = locationValid !== null && (!isPhotoRequired || photo) && !submitting;
  const alreadyDone = mode === 'masuk' ? !!todayAttendance?.check_in_time : !!todayAttendance?.check_out_time;

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
            onClick={() => { setMode(m); setPhoto(''); setIsFaceValid(true); setLat(null); setLng(null); setDistance(null); setLocationValid(null); stopCamera(); }}
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
            <button onClick={getLocation} className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center"><MapPin className="w-7 h-7 text-blue-600" /></div>
              <p className="text-blue-600 font-medium text-sm">Ambil Lokasi</p>
            </button>
          )}
          {locationLoading && <div className="flex flex-col items-center gap-3 p-8"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}
          {locationValid !== null && !locationLoading && (
            <div className="space-y-3">
              <div className={`rounded-xl p-4 border-2 ${locationValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {locationValid ? <CheckCircle className="w-6 h-6 text-green-600" /> : <XCircle className="w-6 h-6 text-red-600" />}
                  <p className={`font-semibold text-sm ${locationValid ? 'text-green-700' : 'text-red-700'}`}>{locationValid ? 'Lokasi Valid' : 'Lokasi Tidak Valid'}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                  <div><p className="text-gray-500">Latitude</p><p className="font-mono">{lat?.toFixed(6)}</p></div>
                  <div><p className="text-gray-500">Longitude</p><p className="font-mono">{lng?.toFixed(6)}</p></div>
                  <div><p className="text-gray-500">Jarak</p><p className={`font-bold ${locationValid ? 'text-green-600' : 'text-red-600'}`}>{distance}m</p></div>
                  <div><p className="text-gray-500">Batas</p><p className="font-medium">{settings?.radius_lokasi || 100}m</p></div>
                </div>
              </div>
              <button onClick={getLocation} className="w-full text-xs text-blue-600 hover:underline">Perbarui</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</span>
            Foto Selfie
          </h3>
          {!isPhotoRequired ? (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-200 h-[200px]">
                  <Camera className="w-8 h-8 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">Fitur foto dinonaktifkan Admin</p>
              </div>
          ) : (
            <>
              {!cameraActive && !photo && (
                <button onClick={startCamera} className="w-full flex flex-col items-center gap-3 p-8 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors">
                  <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center"><Camera className="w-7 h-7 text-blue-600" /></div>
                  <p className="text-blue-600 font-medium text-sm">Ambil Foto</p>
                </button>
              )}
              {cameraError && <div className="p-3 mb-3 bg-red-50 rounded-lg border border-red-200"><p className="text-red-600 text-sm font-medium">{cameraError}</p></div>}
              {cameraActive && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden bg-black aspect-video relative">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      {!isModelsLoaded && <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">Memuat AI...</div>}
                  </div>
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
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mt-6">
        <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</span>
          Konfirmasi
        </h3>
        <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
          <div className={`flex items-center gap-1 ${locationValid === true ? 'text-green-600' : 'text-gray-400'}`}>
            {locationValid === true ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} Lokasi valid
          </div>
          <div className={`flex items-center gap-1 ${isFaceValid ? 'text-green-600' : 'text-red-500'}`}>
            {isFaceValid ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />} Wajah terdeteksi
          </div>
          <div className="flex items-center gap-1 text-blue-600"><Clock className="w-4 h-4" /> {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
        <button onClick={handleSubmit} disabled={!canSubmit || (alreadyDone && settings?.absen_ganda === 0)} className={`w-full py-3 rounded-xl text-white font-semibold text-sm transition-all ${canSubmit && !(alreadyDone && settings?.absen_ganda === 0) ? mode === 'masuk' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700' : 'bg-gray-300 cursor-not-allowed'}`}>
          {submitting ? 'Memproses...' : `Absen ${mode === 'masuk' ? 'Masuk' : 'Pulang'}`}
        </button>
      </div>
    </div>
  );
}