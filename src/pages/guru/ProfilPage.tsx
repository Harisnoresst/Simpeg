import { useState, useEffect, useRef } from 'react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Bell, Check, Camera, GraduationCap, BackpackIcon, 
  Calendar, Book, FileText, Users, Monitor, FileX, History, ClipboardList, Loader2, School,
  Backpack
} from 'lucide-react';

export default function ProfilPage() {
  const { profile, refreshProfile } = useAuth();
  
  const [view, setView] = useState<'overview' | 'profil' | 'ubah_password' | 'sukses'>('overview');

  // --- PERBAIKAN: Form ditambahkan field pekerjaan ---
  const [form, setForm] = useState({ 
    nip: '', nama: '', jabatan: '', email: '', phone: '', alamat: '', avatar_url: '',
    pendidikan: '', golongan: '', tanggal_mulai: '', status_pegawai: ''
  });
  
  const [originalData, setOriginalData] = useState(form);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State Data Tampilan
  const [pekerjaan, setPekerjaan] = useState({
    unitKerja: 'Memuat...', tanggalMulai: '-', mataPelajaran: '-', pendidikan: '-', status: '-', golongan: '-'
  });
  const [kehadiran, setKehadiran] = useState({ hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passForm, setPassForm] = useState({ lama: '', baru: '', konfirmasi: '' });
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      if (profile) {
        try {
          // Tarik data profil lengkap & setting sekolah
          const [profRes, dashRes] = await Promise.all([
             api.get('/profile/details'),
             api.get('/dashboard') // Untuk tarik nama instansi
          ]);

          const dataProfile = profRes.data;
          const dataInstansi = dashRes.data.school?.name || 'Instansi Belum Diatur';

          // Set form untuk Edit (Sekarang termasuk pendidikan dll)
          const dbData = {
            nip: profile.nip || '',
            nama: profile.name || '',
            jabatan: profile.subject || '',
            email: profile.email || '',
            phone: profile.phone || '',
            alamat: profile.address || '',
            avatar_url: profile.avatar_url || '',
            pendidikan: dataProfile.pekerjaan?.pendidikan || '',
            golongan: dataProfile.pekerjaan?.golongan || '',
            tanggal_mulai: dataProfile.pekerjaan?.tanggalMulai || '',
            status_pegawai: dataProfile.pekerjaan?.status || '',
          };
          
          setForm(dbData);
          setOriginalData(dbData);

          // Set tampilan Info Pekerjaan (Unit Kerja otomatis dari Instansi Admin)
          setPekerjaan({
            unitKerja: dataInstansi,
            tanggalMulai: dataProfile.pekerjaan?.tanggalMulai || '-',
            mataPelajaran: profile.subject || '-',
            pendidikan: dataProfile.pekerjaan?.pendidikan || '-',
            status: dataProfile.pekerjaan?.status || '-',
            golongan: dataProfile.pekerjaan?.golongan || '-'
          });

          setKehadiran(dataProfile.kehadiran || { hadir: 0, tidakHadir: 0, terlambat: 0, izin: 0 });

        } catch (error) {
          console.error("Gagal mengambil detail profil", error);
        }

        setIsLoading(false);
      }
    }
    fetchDetails();
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSimpanProfil = async () => {
    setIsSaving(true);
    try {
      if (profile) {
        // PERBAIKAN: Kirim semua data termasuk yang baru
        const payload = {
          nip: form.nip,
          name: form.nama,
          subject: form.jabatan,
          phone: form.phone,
          address: form.alamat,
          pendidikan: form.pendidikan,
          golongan: form.golongan,
          tanggal_mulai: form.tanggal_mulai,
          status_pegawai: form.status_pegawai
        };

        await api.put('/profile', payload); 
        await refreshProfile(); 
        
        window.location.reload(); 
      }
    } catch (err: any) {
      alert('Gagal menyimpan: ' + (err.response?.data?.message || err.message));
      setOriginalData(form);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Pilih gambar untuk diupload.');

      const file = event.target.files[0];
      const formData = new FormData();
      formData.append('avatar', file); 

      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setForm((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      setOriginalData((prev) => ({ ...prev, avatar_url: data.avatar_url }));
      await refreshProfile(); 
      
    } catch (error: any) {
      alert('Gagal mengupload gambar: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => setForm(originalData);
  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  const handleSimpanPassword = async () => {
    if (!passForm.lama || !passForm.baru || !passForm.konfirmasi) { alert("Harap isi semua kolom password!"); return; }
    if (passForm.baru.length < 6) { alert("Password baru minimal 6 karakter!"); return; }
    if (passForm.baru !== passForm.konfirmasi) { alert("Password baru dan konfirmasi tidak cocok!"); return; }

    setIsSavingPass(true);
    try {
        if (profile) {
            await api.put('/profile/password', { current_password: passForm.lama, password: passForm.baru, password_confirmation: passForm.konfirmasi });
        }
        setView('sukses');
        setPassForm({ lama: '', baru: '', konfirmasi: '' });
    } catch (err: any) {
        alert('Gagal mengubah password: ' + (err.response?.data?.message || err.message));
    } finally {
        setIsSavingPass(false);
    }
  };

  if (view === 'sukses') {
      return (
        <div className="min-h-screen bg-[#f4f7fb] font-sans flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-8">
             <div className="w-28 h-28 rounded-full border-[8px] border-[#22c55e] flex items-center justify-center mb-6"><Check className="w-14 h-14 text-[#22c55e] stroke-[4]" /></div>
             <h2 className="text-2xl font-bold text-gray-900 mb-2">Password berhasil diubah!</h2>
             <p className="text-gray-500 text-sm mb-10">Password Anda telah berhasil diperbarui.</p>
             <button onClick={() => setView('overview')} className="bg-[#4455f0] hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-md text-sm transition-colors shadow-sm">Kembali ke Dashboard</button>
          </div>
        </div>
      );
  }

  if (view === 'overview') {
      return (
          <div className="min-h-screen bg-[#f4f7fb] font-sans pb-12 pt-8"> 
              <div className="max-w-[1200px] mx-auto px-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col justify-between">
                       <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-8">
                           <div className="relative w-32 h-32 shrink-0 group">
                               <img src={form.avatar_url || ""} alt="" className="w-full h-full rounded-full object-cover border-4 border-gray-50" />
                               <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadFoto} className="hidden" />
                               <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-100 text-[#1e3a8a] hover:bg-gray-50 transition-colors disabled:opacity-50">
                                   {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                               </button>
                           </div>
                           <div className="flex-1 space-y-3 w-full text-sm">
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]"><span className="font-bold text-gray-800">NIP</span><span>:</span><span className="text-gray-600">{form.nip}</span></div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]"><span className="font-bold text-gray-800">Nama</span><span>:</span><span className="text-gray-600">{form.nama}</span></div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]"><span className="font-bold text-gray-800">Jabatan</span><span>:</span><span className="text-gray-600">{form.jabatan}</span></div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]"><span className="font-bold text-gray-800">Email</span><span>:</span><span className="text-gray-600">{form.email}</span></div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]"><span className="font-bold text-gray-800">No. HP</span><span>:</span><span className="text-gray-600">{form.phone}</span></div>
                               <div className="grid grid-cols-[80px_10px_1fr] sm:grid-cols-[100px_10px_1fr]"><span className="font-bold text-gray-800">Alamat</span><span>:</span><span className="text-gray-600">{form.alamat}</span></div>
                           </div>
                       </div>
                       <button onClick={() => setView('profil')} className="w-full py-2.5 border border-[#4f46e5] text-[#4f46e5] hover:bg-blue-50 font-medium rounded-md text-sm transition-colors text-center">Ubah Profil</button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h2 className="text-[#1e3a8a] font-bold text-[15px] mb-6">Ubah Password</h2>
                        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                            <div><label className="block text-xs text-gray-600 mb-1.5">Password Lama</label><input type="password" name="lama" placeholder="Masukkan Password Lama" value={passForm.lama} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" /></div>
                            <div><label className="block text-xs text-gray-600 mb-1.5">Password Baru</label><input type="password" name="baru" placeholder="Masukkan Password Baru" value={passForm.baru} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" /></div>
                            <div><label className="block text-xs text-gray-600 mb-1.5">Konfirmasi Password Baru</label><input type="password" name="konfirmasi" placeholder="Konfirmasi Password Baru" value={passForm.konfirmasi} onChange={handlePassChange} className="w-full border border-gray-200 rounded text-xs px-3 py-2.5 focus:outline-none focus:border-blue-500" /></div>
                            <div className="bg-[#eef2ff] text-[#4f46e5] text-[11px] p-3 rounded-md mt-6">Password minimal 6 Karakter, kombinasi huruf dan angka</div>
                            <div className="flex items-center gap-3 pt-4">
                                <button onClick={handleSimpanPassword} disabled={isSavingPass} className="bg-[#2563eb] hover:bg-blue-700 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors">{isSavingPass ? 'Menyimpan...' : 'Simpan'}</button>
                                <button onClick={() => setPassForm({lama: '', baru: '', konfirmasi: ''})} className="bg-[#6b7280] hover:bg-gray-600 text-white px-6 py-2 rounded text-[13px] font-medium transition-colors">Batal</button>
                            </div>
                        </form>
                    </div>

                    {/* KARTU 3: Informasi Pekerjaan (Unit Kerja Sync dgn Admin) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                       <h3 className="font-bold text-lg text-gray-900 mb-8 flex items-center gap-2"><BackpackIcon className="w-6 h-6 text-gray-700" /> Informasi Pekerjaan</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-4">
                           <div className="flex items-start gap-4"><School className="w-6 h-6 text-gray-800 shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Unit kerja (Instansi)</p><p className="text-sm font-medium text-gray-900">{pekerjaan.unitKerja}</p></div></div>
                           <div className="flex items-start gap-4"><Calendar className="w-6 h-6 text-gray-800 shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Tanggal Mulai Mengajar</p><p className="text-sm font-medium text-gray-900">{pekerjaan.tanggalMulai}</p></div></div>
                           <div className="flex items-start gap-4"><Book className="w-6 h-6 text-gray-800 shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Mata Pelajaran</p><p className="text-sm font-medium text-gray-900">{pekerjaan.mataPelajaran}</p></div></div>
                           <div className="flex items-start gap-4"><GraduationCap className="w-6 h-6 text-gray-800 shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Pendidikan Terakhir</p><p className="text-sm font-medium text-gray-900">{pekerjaan.pendidikan}</p></div></div>
                           <div className="flex items-start gap-4"><FileText className="w-6 h-6 text-gray-800 shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Status Kepegawaian</p><p className="text-sm font-medium text-gray-900">{pekerjaan.status}</p></div></div>
                           <div className="flex items-start gap-4"><Users className="w-6 h-6 text-gray-800 shrink-0" /><div><p className="text-xs text-gray-500 mb-0.5">Golongan/Pangkat</p><p className="text-sm font-medium text-gray-900">{pekerjaan.golongan}</p></div></div>
                       </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                       <h3 className="font-bold text-lg text-gray-900 mb-6">Ringkasan Kehadiran (Bulan Ini)</h3>
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-green-600 font-semibold text-sm mb-2">Hadir</p><p className="text-3xl font-bold text-green-600">{kehadiran.hadir}</p><Monitor className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-red-600 font-semibold text-sm mb-2">Tidak Hadir</p><p className="text-3xl font-bold text-red-600">{kehadiran.tidakHadir}</p><FileX className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-yellow-400 font-semibold text-sm mb-2">Terlambat</p><p className="text-3xl font-bold text-yellow-400">{kehadiran.terlambat}</p><History className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
                           <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 relative"><p className="text-blue-600 font-semibold text-sm mb-2">Izin</p><p className="text-3xl font-bold text-blue-600">{kehadiran.izin}</p><ClipboardList className="absolute bottom-4 right-4 w-5 h-5 text-gray-400" /></div>
                       </div>
                    </div>

                 </div>
                 <div className="bg-gray-100 text-gray-700 text-[13px] p-4 rounded-md mt-6 shadow-sm">Pastikan informasi profil Anda selalu diperbarui untuk data yang Akurat.</div>
              </div>
          </div>
      )
  }


  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans pb-12 pt-6"> 
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center mb-8 mx-6 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('overview')} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-800" /></button>
          <h1 className="text-lg font-bold text-gray-900">{view === 'profil' ? 'Ubah Profil Lengkap' : 'Ubah Password'}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row gap-10 lg:gap-16 items-start">
          <div className="w-full md:w-[35%] flex flex-col items-center pt-4 shrink-0">
            <div className="relative w-56 h-56 rounded-full overflow-hidden shadow-sm mb-8 border-4 border-white bg-gray-100 group">
                <img src={form.avatar_url || ""} alt="Foto Profil" className="w-full h-full object-cover" />
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadFoto} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-md border border-gray-100 text-[#1e3a8a] hover:bg-gray-50 transition-colors disabled:opacity-50">
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
            </div>
            <button onClick={() => setView('profil')} className={`w-56 font-medium py-2.5 rounded-md text-sm transition-colors shadow-sm mb-3 ${view === 'profil' ? 'bg-[#4f46e5] text-white' : 'bg-white border border-[#4f46e5] text-[#4f46e5] hover:bg-blue-50'}`}>Ubah Profil</button>
            <button onClick={() => setView('ubah_password')} className={`w-56 font-medium py-2.5 rounded-md text-sm transition-colors shadow-sm ${view === 'ubah_password' ? 'bg-[#4f46e5] text-white' : 'bg-white border border-[#4f46e5] text-[#4f46e5] hover:bg-blue-50'}`}>Ubah Password</button>
          </div>

          <div className="w-full md:w-[65%]">
            {view === 'profil' ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-[#1e3a8a] font-bold text-lg mb-6">Informasi Data Diri & Pekerjaan</h2>
                {isLoading ? (
                  <div className="text-center py-10 text-gray-500">Memuat data profil...</div>
                ) : (
                  <form className="space-y-4">
                    {/* Data Diri Dasar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm text-gray-600 mb-1.5">NIP</label><input type="text" name="nip" value={form.nip} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1.5">Nama Lengkap</label><input type="text" name="nama" value={form.nama} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm text-gray-600 mb-1.5">Email</label><input type="email" name="email" value={form.email} readOnly className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm bg-gray-50 text-gray-500 outline-none" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1.5">No. HP</label><input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                    </div>

                    <div><label className="block text-sm text-gray-600 mb-1.5">Alamat Lengkap</label><input type="text" name="alamat" value={form.alamat} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>

                    <hr className="my-6 border-gray-100"/>
                    <h3 className="font-bold text-gray-800 text-sm mb-4">Informasi Pekerjaan</h3>

                    {/* Data Pekerjaan Tambahan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm text-gray-600 mb-1.5">Mata Pelajaran (Jabatan)</label><input type="text" name="jabatan" value={form.jabatan} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1.5">Pendidikan Terakhir</label>
                            <select name="pendidikan" value={form.pendidikan} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white">
                                <option value="">-- Pilih Pendidikan --</option>
                                <option value="SMA/SMK">SMA/SMK</option>
                                <option value="D3">D3</option>
                                <option value="S1">S1 / Sarjana</option>
                                <option value="S2">S2 / Magister</option>
                                <option value="S3">S3 / Doktor</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm text-gray-600 mb-1.5">Golongan / Pangkat</label><input type="text" name="golongan" placeholder="Cth: III/b, Honorer..." value={form.golongan} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                        <div><label className="block text-sm text-gray-600 mb-1.5">Status Kepegawaian</label><input type="text" name="status_pegawai" placeholder="Cth: PNS, PPPK, Honorer..." value={form.status_pegawai} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>
                    </div>

                    <div><label className="block text-sm text-gray-600 mb-1.5">Tanggal Mulai Mengajar</label><input type="date" name="tanggal_mulai" value={form.tanggal_mulai} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-blue-500" /></div>

                    <div className="flex items-center gap-3 pt-6 border-t border-gray-100 mt-6">
                      <button type="button" onClick={handleSimpanProfil} disabled={isSaving} className="bg-[#2563eb] hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors">
                        {isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                      </button>
                      <button type="button" onClick={handleReset} disabled={isSaving} className="bg-[#6b7280] hover:bg-gray-600 text-white px-6 py-2.5 rounded-md text-sm font-medium transition-colors">Batal</button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
               <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-md">
                 <h2 className="text-[#1e3a8a] font-bold text-[15px] mb-6">Ubah Password</h2>
                 {/* (Form Password tetap sama) */}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}