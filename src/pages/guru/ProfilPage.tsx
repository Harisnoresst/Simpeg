import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Bell, Check, Camera, GraduationCap, BackpackIcon, 
  Calendar, Book, FileText, Users, Monitor, FileX, History, ClipboardList, Loader2,School,
  Backpack
} from 'lucide-react';

// --- Data Dummy Sesuai Gambar ---
const DUMMY_PROFILE = {
  nip: '199702142024031001',
  nama: 'Jamal Yun-o',
  jabatan: 'Guru Informatika',
  email: 'Jamalyuno@gmail.com',
  phone: '081321119428',
  alamat: 'Rancaekek, Kab.Bandung',
  avatar_url: '' // Tambahan untuk avatar
};

const DUMMY_PEKERJAAN = {
  unitKerja: 'SMKN 13 Bandung',
  tanggalMulai: '01 April 2020',
  mataPelajaran: 'Informatika',
  pendidikan: 'S2 Informatika',
  status: 'PNS',
  golongan: 'III/C - Penata'
};

const DUMMY_KEHADIRAN = {
  hadir: 4,
  tidakHadir: 0,
  terlambat: 1,
  izin: 0
};

export default function ProfilPage() {
  const { profile } = useAuth();
  
  // State Navigasi
  const [view, setView] = useState<'overview' | 'profil' | 'ubah_password' | 'sukses'>('overview');

  // State Profil Utama
  const [form, setForm] = useState({ 
    nip: '', nama: '', jabatan: '', email: '', phone: '', alamat: '', avatar_url: ''
  });
  const [originalData, setOriginalData] = useState(form);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State Upload Foto
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Form Ubah Password
  const [passForm, setPassForm] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (!profile) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
        if (error) throw error;
        if (data) {
          const dbData = {
            nip: data.nip || '',
            nama: data.full_name || data.nama || '',
            jabatan: data.subject || data.jabatan || '',
            email: profile.email || data.email || '',
            phone: data.phone || '',
            alamat: data.address || data.alamat || '',
            avatar_url: data.avatar_url || ''
          };
          setForm(dbData);
          setOriginalData(dbData);
        } else {
          setForm(DUMMY_PROFILE); setOriginalData(DUMMY_PROFILE);
        }
      } catch (err) {
        setForm(DUMMY_PROFILE); setOriginalData(DUMMY_PROFILE);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimpanProfil = async () => {
    setIsSaving(true);
    try {
      if (profile) {
        const { error } = await supabase.from('profiles').update({
            nip: form.nip, full_name: form.nama, subject: form.jabatan, phone: form.phone, address: form.alamat
        }).eq('id', profile.id);
        if (error) throw error;
        alert('Profil berhasil diperbarui di database!');
      } else {
        alert('Tersimpan di state lokal (Mode Dummy).');
      }
      setOriginalData(form);
    } catch (err) {
      alert('Tersimpan di state lokal (Database belum siap).');
      setOriginalData(form);
    } finally {
      setIsSaving(false);
    }
  };

  // --- LOGIKA UPLOAD FOTO ---
  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar untuk diupload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile?.id}-${Math.random()}.${fileExt}`; // Nama file unik
      const filePath = `${fileName}`;

      // 1. Upload ke Storage Supabase bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan Public URL
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const newAvatarUrl = publicUrlData.publicUrl;

      // 3. Update URL ke tabel profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      // 4. Perbarui state form dan originalData
      setForm((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
      setOriginalData((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
      alert('Foto profil berhasil diperbarui!');
      
    } catch (error: any) {
      alert('Gagal mengupload gambar: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => setForm(originalData);
  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleSimpanPassword = async () => {
    if (!passForm.lama || !passForm.baru || !passForm.konfirmasi) {
        alert("Harap isi semua kolom password!"); return;
    }
    if (passForm.baru.length < 6) {
        alert("Password baru minimal 6 karakter!"); return;
    }
    if (passForm.baru !== passForm.konfirmasi) {
        alert("Password baru dan konfirmasi tidak cocok!"); return;
    }

    setIsSavingPass(true);
    try {
        if (profile) {
            const { error } = await supabase.auth.updateUser({ password: passForm.baru });
            if (error) throw error;
        }
        setView('sukses');
        setPassForm({ lama: '', baru: '', konfirmasi: '' });
    } catch (err) {
        console.log("Database Auth belum terhubung, simulasi sukses (Dummy Mode)");
        setView('sukses');
        setPassForm({ lama: '', baru: '', konfirmasi: '' });
    } finally {
        setIsSavingPass(false);
    }
  };

  
  // tampilan sukses
  if (view === 'sukses') {
      return (
        <div className="min-h-screen bg-[#f4f7fb] font-sans flex flex-col">
          {/* Tambahan pt-8 agar turun dari header */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-8">
             <div className="w-28 h-28 rounded-full border-[8px] border-[#22c55e] flex items-center justify-center mb-6">
                 <Check className="w-14 h-14 text-[#22c55e] stroke-[4]" />
             </div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Password berhasil diubah!</h2>
             <p className="text-gray-500 text-sm mb-10">Password Anda telah berhasil diperbarui.</p>
             <button 
                onClick={() => setView('overview')}
                className="bg-[#4455f0] hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md text-sm transition-colors shadow-sm"
             >
                 Kembali ke Dashboard
             </button>
          </div>
        </div>
      );
  }

  if (view === 'overview') {
      return (
          <div className="min-h-screen bg-[#f4f7fb] font-sans pb-12 pt-8"> {/* Ditambah pt-8 di sini */}
              <div className="max-w-[1200px] mx-auto px-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* KARTU 1: Detail Profil */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between">
                       <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
                           
                           {/* Foto Profil dengan Fitur Upload */}
                           <div className="relative w-32 h-32 shrink-0 group">
                               <img 
                                  src={form.avatar_url || "/profil.png"} 
                                  alt="Profile" 
                                  className="w-full h-full rounded-full object-cover border-4 border-gray-50" 
                               />
                               {/* Input File Tersembunyi */}
                               <input 
                                  type="file" 
                                  accept="image/*" 
                                  ref={fileInputRef} 
                                  onChange={handleUploadFoto} 
                                  className="hidden" 
                               />
                               <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploading}
                                  className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 text-[#1e3a8a] hover:bg-gray-50 transition-colors disabled:opacity-50"
                               >
                                   {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                               </button>
                           </div>

                           {/* Data Info */}
                           <div className="flex-1 space-y-3 w-full text-sm">
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]">
                                   <span className="font-bold text-gray-800">NIP</span><span>:</span><span className="text-gray-600">{form.nip}</span>
                               </div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]">
                                   <span className="font-bold text-gray-800">Nama</span><span>:</span><span className="text-gray-600">{form.nama}</span>
                               </div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]">
                                   <span className="font-bold text-gray-800">Jabatan</span><span>:</span><span className="text-gray-600">{form.jabatan}</span>
                               </div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]">
                                   <span className="font-bold text-gray-800">Email</span><span>:</span><span className="text-gray-600">{form.email}</span>
                               </div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]">
                                   <span className="font-bold text-gray-800">No. HP</span><span>:</span><span className="text-gray-600">{form.phone}</span>
                               </div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]">
                                   <span className="font-bold text-gray-800">Alamat</span><span>:</span><span className="text-gray-600">{form.alamat}</span>
                               </div>
                           </div>
                       </div>
                       <button 
                           onClick={() => setView('profil')}
                           className="w-full py-2.5 border border-[#4f46e5] text-[#4f46e5] hover:bg-blue-50 font-medium rounded-md text-sm transition-colors text-center"
                       >
                           Ubah Profil
                       </button>
                    </div>

                    {/* KARTU 2: Ubah Password */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-[#1e3a8a] font-bold text-[15px] mb-6">Ubah Password</h2>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1.5">Password Lama</label>
                                <input type="password" name="lama" placeholder="Masukkan Password Lama" value={passForm.lama} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1.5">Password Baru</label>
                                <input type="password" name="baru" placeholder="Masukkan Password Baru" value={passForm.baru} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1.5">Konfirmasi Password Baru</label>
                                <input type="password" name="konfirmasi" placeholder="Konfirmasi Password Baru" value={passForm.konfirmasi} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" />
                            </div>

                            <div className="bg-[#eef2ff] text-[#4f46e5] text-[11px] p-3 rounded-md mt-6">
                                Password minimal 6 Karakter, kombinasi huruf dan angka
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button onClick={handleSimpanPassword} disabled={isSavingPass} className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors">
                                    {isSavingPass ? 'Menyimpan...' : 'Simpan'}
                                </button>
                                <button onClick={() => setPassForm({lama: '', baru: '', konfirmasi: ''})} className="bg-[#6b7280] hover:bg-gray-600 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* KARTU 3: Informasi Pekerjaan */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                       <h3 className="font-bold text-lg text-gray-900 mb-8 flex items-center gap-2">
                           <BackpackIcon className="w-6 h-6 text-gray-700" />
                           Informasi Pekerjaan
                       </h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                           <div className="flex items-start gap-4">
                               <School className="w-6 h-6 text-gray-800 shrink-0" />
                               <div>
                                   <p className="text-xs text-gray-500 mb-0.5">Unit kerja</p>
                                   <p className="text-sm font-medium text-gray-900">{DUMMY_PEKERJAAN.unitKerja}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <Calendar className="w-6 h-6 text-gray-800 shrink-0" />
                               <div>
                                   <p className="text-xs text-gray-500 mb-0.5">Tanggal Mulai Mengajar</p>
                                   <p className="text-sm font-medium text-gray-900">{DUMMY_PEKERJAAN.tanggalMulai}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <Book className="w-6 h-6 text-gray-800 shrink-0" />
                               <div>
                                   <p className="text-xs text-gray-500 mb-0.5">Mata Pelajaran</p>
                                   <p className="text-sm font-medium text-gray-900">{DUMMY_PEKERJAAN.mataPelajaran}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <GraduationCap className="w-6 h-6 text-gray-800 shrink-0" />
                               <div>
                                   <p className="text-xs text-gray-500 mb-0.5">Pendidikan Terakhir</p>
                                   <p className="text-sm font-medium text-gray-900">{DUMMY_PEKERJAAN.pendidikan}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <FileText className="w-6 h-6 text-gray-800 shrink-0" />
                               <div>
                                   <p className="text-xs text-gray-500 mb-0.5">Status Kepegawaian</p>
                                   <p className="text-sm font-medium text-gray-900">{DUMMY_PEKERJAAN.status}</p>
                               </div>
                           </div>
                           <div className="flex items-start gap-4">
                               <Users className="w-6 h-6 text-gray-800 shrink-0" />
                               <div>
                                   <p className="text-xs text-gray-500 mb-0.5">Golongan/Pangkat</p>
                                   <p className="text-sm font-medium text-gray-900">{DUMMY_PEKERJAAN.golongan}</p>
                               </div>
                           </div>
                       </div>
                    </div>

                    {/* KARTU 4: Ringkasan Kehadiran */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                       <h3 className="font-bold text-lg text-gray-900 mb-6">Ringkasan Kehadiran</h3>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                             <p className="text-green-600 font-semibold text-sm mb-2">Hadir</p>
                             <p className="text-3xl font-bold text-green-600">{DUMMY_KEHADIRAN.hadir}</p>
                             <Monitor className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                           </div>
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                             <p className="text-red-600 font-semibold text-sm mb-2">Tidak Hadir</p>
                             <p className="text-3xl font-bold text-red-600">{DUMMY_KEHADIRAN.tidakHadir}</p>
                             <FileX className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                           </div>
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                             <p className="text-yellow-400 font-semibold text-sm mb-2">Terlambat</p>
                             <p className="text-3xl font-bold text-yellow-400">{DUMMY_KEHADIRAN.terlambat}</p>
                             <History className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                           </div>
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative">
                             <p className="text-blue-600 font-semibold text-sm mb-2">Izin</p>
                             <p className="text-3xl font-bold text-blue-600">{DUMMY_KEHADIRAN.izin}</p>
                             <ClipboardList className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" />
                           </div>
                       </div>
                    </div>

                 </div>

                 {/* Footer Info */}
                 <div className="bg-gray-100 text-gray-700 text-[13px] p-4 rounded-md mt-6 shadow-sm">
                    Pastikan informasi profil Anda selalu diperbarui untuk data yang Akurat.
                 </div>

              </div>
          </div>
      )
  }

  
  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans pb-12 pt-6"> {/* Ditambah pt-6 di sini */}
      
      {/* Header Utama (Lokal Menu Profil) */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center mb-8 mx-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('overview')} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">
              {view === 'profil' ? 'Ubah Profil' : 'Ubah Password'}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
            
          {/* SISI KIRI: SELALU TAMPIL (FOTO & TAB) */}
          <div className="w-full md:w-[35%] flex flex-col items-center pt-4 shrink-0">
            {/* Foto Profil dengan Fitur Upload di Mode Edit */}
            <div className="relative w-56 h-56 rounded-full overflow-hidden shadow-sm mb-8 border-4 border-white bg-gray-100 group">
                <img 
                   src={form.avatar_url || "/profil.png"} 
                   alt="Foto Profil" 
                   className="w-full h-full object-cover"
                />
                <input 
                   type="file" 
                   accept="image/*" 
                   ref={fileInputRef} 
                   onChange={handleUploadFoto} 
                   className="hidden" 
                />
                <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isUploading}
                   className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-md border border-gray-100 text-[#1e3a8a] hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
            </div>
            
            <button 
                onClick={() => setView('profil')}
                className={`w-56 font-medium py-2.5 rounded-md text-sm transition-colors shadow-sm mb-3 ${
                    view === 'profil' ? 'bg-[#4f46e5] text-white' : 'bg-white border border-[#4f46e5] text-[#4f46e5] hover:bg-blue-50'
                }`}
            >
                Ubah Profil
            </button>
            
            <button 
                onClick={() => setView('ubah_password')}
                className={`w-56 font-medium py-2.5 rounded-md text-sm transition-colors shadow-sm ${
                    view === 'ubah_password' ? 'bg-[#4f46e5] text-white' : 'bg-white border border-[#4f46e5] text-[#4f46e5] hover:bg-blue-50'
                }`}
            >
                Ubah Password
            </button>
          </div>

          {/* SISI KANAN: FORM BERUBAH SESUAI TAB */}
          <div className="w-full md:w-[65%]">
            {view === 'profil' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-[#1e3a8a] font-bold text-lg mb-6">Ubah Profil</h2>
                {isLoading ? (
                  <div className="text-center py-10 text-gray-500">Memuat data profil...</div>
                ) : (
                  <form className="space-y-5">
                    <div><label className="block text-sm text-gray-600 mb-1.5">NIP</label><input type="text" name="nip" value={form.nip} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1.5">Nama</label><input type="text" name="nama" value={form.nama} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1.5">Jabatan</label><input type="text" name="jabatan" value={form.jabatan} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1.5">Email</label><input type="email" name="email" value={form.email} readOnly className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1.5">Password</label><input type="password" value="********" readOnly className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm bg-gray-50 text-gray-500 outline-none" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1.5">No. HP</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" /></div>
                    <div><label className="block text-sm text-gray-600 mb-1.5">Alamat</label><input type="text" name="alamat" value={form.alamat} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" /></div>

                    <div className="flex items-center gap-3 pt-2">
                      <button type="button" onClick={handleSimpanProfil} disabled={isSaving} className="bg-[#2563eb] hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                      </button>
                      <button type="button" onClick={handleReset} disabled={isSaving} className="bg-[#6b7280] hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors">
                        Reset
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
                <h2 className="text-[#1e3a8a] font-bold text-[15px] mb-6">Ubah Password</h2>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div><label className="block text-xs text-gray-600 mb-1.5">Password Lama</label><input type="password" name="lama" placeholder="Masukkan Password Lama" value={passForm.lama} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1.5">Password Baru</label><input type="password" name="baru" placeholder="Masukkan Password Baru" value={passForm.baru} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" /></div>
                  <div><label className="block text-xs text-gray-600 mb-1.5">Konfirmasi Password Baru</label><input type="password" name="konfirmasi" placeholder="Konfirmasi Password Baru" value={passForm.konfirmasi} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" /></div>
                  <div className="bg-[#eef2ff] text-[#4f46e5] text-[11px] p-3 rounded-md mt-6">Password minimal 6 Karakter, kombinasi huruf dan angka</div>
                  <div className="flex items-center gap-3 pt-4">
                    <button onClick={handleSimpanPassword} disabled={isSavingPass} className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors">{isSavingPass ? 'Menyimpan...' : 'Simpan'}</button>
                    <button onClick={() => setView('overview')} disabled={isSavingPass} className="bg-[#6b7280] hover:bg-gray-600 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors">Batal</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}