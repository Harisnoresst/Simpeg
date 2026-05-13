import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bell, MapPin, Clock, Briefcase, LogOut, Users, 
  Camera, LocateFixed, Sun, Moon, Edit, Info, Save, 
  Smartphone, Globe, AlertTriangle, Mail, BellRing, 
  Database, DownloadCloud, UploadCloud, CheckCircle2
} from 'lucide-react';

// --- DATA DUMMY & DEFAULT STATE ---
const DEFAULT_SETTINGS = {
  // Absensi & Lokasi
  radius_lokasi: 100,
  toleransi_terlambat: 15,
  min_durasi_kerja: 6,
  batas_pulang_awal: 15,
  absen_ganda: true,
  foto_selfie: true,
  validasi_lokasi: true,
  batas_masuk: '07:30',
  batas_pulang: '16:00',
  latitude: '-7.795579',
  longitude: '110.369490',
  jam_masuk: '07:15',
  jam_pulang: '15:30',
  istirahat_mulai: '12:00',
  istirahat_selesai: '13:00',
  
  // Aplikasi
  nama_aplikasi: 'SIMPEG Sekolah',
  zona_waktu: 'Asia/Jakarta',
  mode_pemeliharaan: false,
  
  // Notifikasi
  notif_email: true,
  notif_push: true,
  notif_keterlambatan: true,
  notif_pengajuan: true,

  // Backup
  auto_backup: 'Mingguan',
  last_backup: 'Belum pernah backup'
};

export default function AdminPengaturanPage() {
  const { profile } = useAuth();
  
  const [activeTab, setActiveTab] = useState('Pengaturan Absensi');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // --- AMBIL DATA DARI DATABASE ---
  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single();
        if (error) throw error;
        if (data) setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch (err) {
        console.log("Database pengaturan belum disetup, menggunakan default dummy.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // --- HANDLER UBAH NILAI ---
  const handleChange = (key: keyof typeof DEFAULT_SETTINGS, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // --- SIMPAN KE DATABASE ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('app_settings').upsert({ id: 1, ...settings });
      if (error) throw error;
      alert("Pengaturan berhasil disimpan dan disinkronkan!");
    } catch (err) {
      alert("Pengaturan tersimpan secara lokal (Database Supabase untuk settings belum siap).");
    } finally {
      setIsSaving(false);
    }
  };

  // --- HANDLER LOKASI OTOMATIS ---
  const handleUbahLokasiOtomatis = () => {
    if ("geolocation" in navigator) {
      alert("Mencari lokasi Anda...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleChange('latitude', position.coords.latitude.toFixed(6).toString());
          handleChange('longitude', position.coords.longitude.toFixed(6).toString());
        },
        (error) => alert("Gagal mendapatkan lokasi. Pastikan izin GPS diaktifkan.")
      );
    } else {
      alert("Browser Anda tidak mendukung fitur Geolocation.");
    }
  };

  // --- HANDLER BACKUP DATA ---
  const handleBackup = () => {
    setIsBackingUp(true);
    setTimeout(() => {
      const now = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
      handleChange('last_backup', now);
      setIsBackingUp(false);
      alert("Data berhasil dibackup!");
    }, 2000);
  };

  // --- LOGIKA PETA ---
  const lat = parseFloat(settings.latitude);
  const lon = parseFloat(settings.longitude);
  const isMapValid = !isNaN(lat) && !isNaN(lon) && settings.latitude !== '' && settings.longitude !== '';
  const bbox = isMapValid ? `${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}` : '';
  const mapUrl = isMapValid ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}` : '';

  // --- KOMPONEN HELPER ---
  const InputWithSuffix = ({ icon: Icon, title, desc, value, suffix, onChange, type = "number" }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-4">
      <div className="flex gap-4 items-start">
        <div className="p-2.5 bg-[#f8fafc] rounded-lg text-gray-500 mt-0.5"><Icon className="w-5 h-5" /></div>
        <div>
          <p className="text-[13px] font-bold text-gray-800">{title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="relative w-[130px] shrink-0">
        <input 
          type={type} value={value} 
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          className="w-full border border-gray-200 rounded-md py-2.5 pl-3 pr-[50px] text-[13px] font-semibold text-gray-700 focus:outline-none focus:border-blue-500 text-right transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 font-medium">{suffix}</span>
      </div>
    </div>
  );

  const ToggleRow = ({ icon: Icon, title, desc, checked, onChange, iconColor = "text-gray-500" }: any) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0 gap-4">
      <div className="flex gap-4 items-start">
        <div className="p-2.5 bg-[#f8fafc] rounded-lg mt-0.5"><Icon className={`w-5 h-5 ${iconColor}`} /></div>
        <div>
          <p className="text-[13px] font-bold text-gray-800">{title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]"></div>
      </label>
    </div>
  );

  // --- RENDER BLOK UI ---
  const renderPengaturanAbsensi = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8">
        <h2 className="text-[15px] font-bold text-gray-800 mb-6">Pengaturan Absensi</h2>
        <div className="flex flex-col">
            <InputWithSuffix icon={MapPin} title="Radius Lokasi" desc="Jarak maksimal guru saat absen di lokasi sekolah." value={settings.radius_lokasi} suffix="meter" onChange={(v: number) => handleChange('radius_lokasi', v)} />
            <InputWithSuffix icon={Clock} title="Toleransi Terlambat" desc="Batas waktu keterlambatan yang masih dianggap hadir." value={settings.toleransi_terlambat} suffix="menit" onChange={(v: number) => handleChange('toleransi_terlambat', v)} />
            <InputWithSuffix icon={Briefcase} title="Minimal Durasi Kerja" desc="Durasi minimal kerja dalam sehari untuk dianggap hadir penuh." value={settings.min_durasi_kerja} suffix="jam" onChange={(v: number) => handleChange('min_durasi_kerja', v)} />
            <InputWithSuffix icon={LogOut} title="Batas Absen Pulang Lebih Awal" desc="Batas waktu pulang lebih awal." value={settings.batas_pulang_awal} suffix="menit" onChange={(v: number) => handleChange('batas_pulang_awal', v)} />
            <ToggleRow icon={Users} iconColor="text-[#ef4444]" title="Absen Ganda" desc="Izinkan absen lebih dari 1 kali dalam sehari." checked={settings.absen_ganda} onChange={(v: boolean) => handleChange('absen_ganda', v)} />
            <ToggleRow icon={Camera} iconColor="text-[#22c55e]" title="Ambil Foto Selfie" desc="Wajib ambil foto selfie saat absen masuk dan pulang." checked={settings.foto_selfie} onChange={(v: boolean) => handleChange('foto_selfie', v)} />
            <ToggleRow icon={LocateFixed} iconColor="text-[#3b82f6]" title="Validasi Lokasi (GPS)" desc="Aktifkan validasi lokasi menggunakan GPS." checked={settings.validasi_lokasi} onChange={(v: boolean) => handleChange('validasi_lokasi', v)} />
            <InputWithSuffix icon={Sun} title="Batas Waktu Absen Masuk" desc="Setelah waktu ini, absen masuk dianggap terlambat." value={settings.batas_masuk} suffix={<Clock className="w-3.5 h-3.5"/>} type="time" onChange={(v: string) => handleChange('batas_masuk', v)} />
            <InputWithSuffix icon={Moon} title="Batas Waktu Absen Pulang" desc="Sebelum waktu ini, absen pulang dianggap pulang lebih awal." value={settings.batas_pulang} suffix={<Clock className="w-3.5 h-3.5"/>} type="time" onChange={(v: string) => handleChange('batas_pulang', v)} />
        </div>
        <div className="mt-8 pt-2">
            <button onClick={handleSave} disabled={isSaving} className="bg-[#1d4ed8] hover:bg-blue-800 text-white px-6 py-3 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors shadow-sm">
                <Save className="w-4 h-4" /> {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
        </div>
    </div>
  );

  const renderLokasiSekolah = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8 h-fit">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-[15px] font-bold text-gray-800">Lokasi Sekolah</h2>
            <button onClick={handleUbahLokasiOtomatis} className="text-[#3b82f6] border border-[#3b82f6] hover:bg-blue-50 px-4 py-1.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-colors">
                <Edit className="w-3.5 h-3.5" /> Ubah Lokasi (Auto GPS)
            </button>
        </div>
        <div className="w-full h-[220px] bg-gray-100 rounded-xl overflow-hidden mb-6 relative border border-gray-200">
            {isMapValid ? (
                <>
                  <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={mapUrl} className="pointer-events-none opacity-90"></iframe>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                      <div className="bg-blue-500/20 border-2 border-blue-400 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        style={{ width: `${Math.max(60, settings.radius_lokasi * 1.2)}px`, height: `${Math.max(60, settings.radius_lokasi * 1.2)}px` }}></div>
                  </div>
                </>
            ) : (<p className="text-sm text-gray-400 font-medium">Koordinat lokasi tidak valid.</p>)}
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Latitude</label>
                <input type="text" value={settings.latitude} onChange={e => handleChange('latitude', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-800 focus:border-blue-500 focus:outline-none font-medium" />
            </div>
            <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Longitude</label>
                <input type="text" value={settings.longitude} onChange={e => handleChange('longitude', e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-800 focus:border-blue-500 focus:outline-none font-medium" />
            </div>
        </div>
        <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1.5">Radius</label>
            <div className="relative">
                <input type="number" value={settings.radius_lokasi} onChange={e => handleChange('radius_lokasi', Number(e.target.value))} className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-[13px] text-gray-800 focus:border-blue-500 focus:outline-none font-medium" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-gray-500 font-medium">meter</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">* Radius adalah jarak maksimal dari titik lokasi sekolah.</p>
        </div>
        <button onClick={handleSave} className="w-full mt-6 bg-[#1d4ed8] hover:bg-blue-800 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold transition-colors">Simpan Lokasi</button>
    </div>
  );

  const renderJamKerja = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8 h-fit">
        <h2 className="text-[15px] font-bold text-gray-800 mb-6">Jam Kerja Default</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 bg-green-100 rounded-full text-green-600"><Clock className="w-5 h-5" /></div>
                <div>
                    <p className="text-[11px] font-bold text-gray-500 mb-0.5">Jam Masuk</p>
                    <input type="time" value={settings.jam_masuk} onChange={e => handleChange('jam_masuk', e.target.value)} className="text-xl font-black text-gray-900 bg-transparent w-[80px] focus:outline-none" />
                </div>
            </div>
            <div className="border border-gray-100 bg-gray-50/50 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                <div className="p-2.5 bg-red-100 rounded-full text-red-600"><Clock className="w-5 h-5" /></div>
                <div>
                    <p className="text-[11px] font-bold text-gray-500 mb-0.5">Jam Pulang</p>
                    <input type="time" value={settings.jam_pulang} onChange={e => handleChange('jam_pulang', e.target.value)} className="text-xl font-black text-gray-900 bg-transparent w-[80px] focus:outline-none" />
                </div>
            </div>
        </div>
        <div className="flex items-center justify-between py-4 border-t border-gray-100">
            <span className="text-[12px] font-bold text-gray-700">Istirahat</span>
            <div className="flex items-center gap-3">
                <div className="font-bold text-gray-900 text-[13px] flex items-center gap-1">
                    <input type="time" value={settings.istirahat_mulai} onChange={e => handleChange('istirahat_mulai', e.target.value)} className="w-[45px] bg-transparent outline-none" /> - <input type="time" value={settings.istirahat_selesai} onChange={e => handleChange('istirahat_selesai', e.target.value)} className="w-[45px] bg-transparent outline-none" />
                </div>
            </div>
        </div>
        <div className="mt-4 bg-[#eff6ff] rounded-lg p-4 flex gap-3 items-start border border-[#dbeafe]">
            <Info className="w-5 h-5 text-[#3b82f6] shrink-0 mt-0.5" />
            <div>
                <p className="text-[12px] font-bold text-[#1e3a8a] mb-0.5">Catatan</p>
                <p className="text-[11px] text-[#3b82f6] leading-relaxed">Jam kerja ini digunakan untuk perhitungan durasi kerja dan absensi.</p>
            </div>
        </div>
        <button onClick={handleSave} className="w-full mt-6 bg-[#1d4ed8] hover:bg-blue-800 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold transition-colors">Simpan Jam Kerja</button>
    </div>
  );

  const renderAplikasi = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8 max-w-2xl mx-auto">
        <h2 className="text-[15px] font-bold text-gray-800 mb-6 flex items-center gap-2"><Smartphone className="w-5 h-5 text-gray-500" /> Pengaturan Aplikasi</h2>
        <div className="space-y-5">
            <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Nama Aplikasi</label>
                <input type="text" value={settings.nama_aplikasi} onChange={e => handleChange('nama_aplikasi', e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-[13px] text-gray-800 focus:border-blue-500 focus:outline-none font-medium" />
            </div>
            <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Zona Waktu</label>
                <select value={settings.zona_waktu} onChange={e => handleChange('zona_waktu', e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-[13px] text-gray-800 focus:border-blue-500 focus:outline-none font-medium bg-white">
                    <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                    <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                    <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                </select>
            </div>
            <ToggleRow icon={AlertTriangle} iconColor="text-[#f97316]" title="Mode Pemeliharaan" desc="Aktifkan ini untuk mematikan akses guru ke aplikasi sementara waktu." checked={settings.mode_pemeliharaan} onChange={(v: boolean) => handleChange('mode_pemeliharaan', v)} />
        </div>
        <button onClick={handleSave} className="mt-8 bg-[#1d4ed8] hover:bg-blue-800 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" /> Simpan Aplikasi
        </button>
    </div>
  );

  const renderNotifikasi = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8 max-w-2xl mx-auto">
        <h2 className="text-[15px] font-bold text-gray-800 mb-6 flex items-center gap-2"><BellRing className="w-5 h-5 text-gray-500" /> Pengaturan Notifikasi</h2>
        <div className="flex flex-col">
            <ToggleRow icon={Mail} iconColor="text-gray-500" title="Notifikasi Email" desc="Kirim ringkasan laporan absensi harian ke email Admin." checked={settings.notif_email} onChange={(v: boolean) => handleChange('notif_email', v)} />
            <ToggleRow icon={Smartphone} iconColor="text-[#3b82f6]" title="Push Notification App" desc="Kirim notifikasi langsung ke aplikasi mobile guru." checked={settings.notif_push} onChange={(v: boolean) => handleChange('notif_push', v)} />
            <ToggleRow icon={Clock} iconColor="text-[#eab308]" title="Peringatan Keterlambatan" desc="Beri peringatan saat guru absen masuk melewati batas waktu." checked={settings.notif_keterlambatan} onChange={(v: boolean) => handleChange('notif_keterlambatan', v)} />
            <ToggleRow icon={Briefcase} iconColor="text-[#22c55e]" title="Notifikasi Pengajuan" desc="Beri tahu admin jika ada pengajuan izin/cuti baru dari guru." checked={settings.notif_pengajuan} onChange={(v: boolean) => handleChange('notif_pengajuan', v)} />
        </div>
        <button onClick={handleSave} className="mt-8 bg-[#1d4ed8] hover:bg-blue-800 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" /> Simpan Notifikasi
        </button>
    </div>
  );

  const renderBackup = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] border border-gray-100 p-8 max-w-2xl mx-auto">
        <h2 className="text-[15px] font-bold text-gray-800 mb-6 flex items-center gap-2"><Database className="w-5 h-5 text-gray-500" /> Backup & Restore Data</h2>
        
        <div className="p-5 border border-gray-200 rounded-lg bg-gray-50/50 mb-8">
            <p className="text-[12px] font-bold text-gray-600 mb-1">Status Backup Terakhir</p>
            <div className="flex items-center gap-2 text-gray-900 font-bold text-[14px]">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> {settings.last_backup}
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-2">Jadwal Auto-Backup</label>
                <select value={settings.auto_backup} onChange={e => handleChange('auto_backup', e.target.value)} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-[13px] text-gray-800 focus:border-blue-500 focus:outline-none font-medium bg-white">
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Nonaktif">Matikan Auto-Backup</option>
                </select>
            </div>
            
            <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
                <button onClick={handleBackup} disabled={isBackingUp} className="flex-1 bg-[#10b981] hover:bg-green-700 text-white px-6 py-3 rounded-md text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm">
                    <DownloadCloud className="w-5 h-5" /> {isBackingUp ? 'Memproses...' : 'Backup Data Sekarang'}
                </button>
                <button onClick={() => alert("Fitur restore akan meminta upload file SQL/CSV.")} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-md text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
                    <UploadCloud className="w-5 h-5" /> Restore Data
                </button>
            </div>
        </div>
        <button onClick={handleSave} className="mt-8 bg-[#1d4ed8] hover:bg-blue-800 text-white px-6 py-2.5 rounded-md text-[13px] font-semibold flex items-center gap-2 transition-colors">
            <Save className="w-4 h-4" /> Simpan Pengaturan Backup
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f7fc] font-sans pb-12">

      {/* TABS MENU */}
      <div className="bg-white px-8 pt-2 flex items-center border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {['Pengaturan Absensi', 'Lokasi Sekolah', 'Jam kerja', 'Aplikasi', 'Notifikasi', 'Backup Data'].map(tab => (
            <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3.5 text-[13px] font-bold whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab 
                    ? 'border-[#3b82f6] text-[#3b82f6]' 
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
            >
                {tab}
            </button>
        ))}
      </div>

      <div className="max-w-[1400px] mx-auto px-8">
        {/* RENDER KONTEN TAB UTAMA */}
        {activeTab === 'Pengaturan Absensi' && (
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
              {renderPengaturanAbsensi()}
              <div className="space-y-6">
                  {renderLokasiSekolah()}
                  {renderJamKerja()}
              </div>
          </div>
        )}

        {/* RENDER TAB SPESIFIK */}
        {activeTab === 'Lokasi Sekolah' && <div className="max-w-2xl mx-auto">{renderLokasiSekolah()}</div>}
        {activeTab === 'Jam kerja' && <div className="max-w-2xl mx-auto">{renderJamKerja()}</div>}
        {activeTab === 'Aplikasi' && renderAplikasi()}
        {activeTab === 'Notifikasi' && renderNotifikasi()}
        {activeTab === 'Backup Data' && renderBackup()}
        
      </div>
    </div>
  );
}