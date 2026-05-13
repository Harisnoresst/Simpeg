import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Bell, Plus, Info, Search, FileText, Edit, Trash2, 
  X, UploadCloud, Send, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';

// --- Tipe Data ---
type LeaveRequest = {
  id: string;
  created_at: string; 
  type: string; 
  start_date: string;
  end_date: string;
  reason: string;
  status: 'menunggu' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  attachment_name: string | null;
  attachment_size: string | null;
};

// --- Data Dummy ---
const DUMMY_DATA: LeaveRequest[] = [
  { id: '1', created_at: '2026-05-20', type: 'Izin', start_date: '2026-05-21', end_date: '2026-05-21', reason: 'Izin karena sakit', status: 'menunggu', attachment_name: 'Surat_dokter.pdf', attachment_size: '245 KB' },
  { id: '2', created_at: '2026-05-10', type: 'Sakit', start_date: '2026-05-11', end_date: '2026-05-13', reason: 'Tipes rawat inap', status: 'Disetujui', attachment_name: 'surat_cuti.pdf', attachment_size: '312 KB' },
  { id: '3', created_at: '2026-05-02', type: 'Izin', start_date: '2026-05-03', end_date: '2026-05-03', reason: 'Acara keluarga mendadak', status: 'Ditolak', attachment_name: null, attachment_size: null },
  { id: '4', created_at: '2026-04-18', type: 'Izin', start_date: '2026-04-19', end_date: '2026-04-19', reason: 'Perpanjang STNK', status: 'Disetujui', attachment_name: 'surat_izin.jpg', attachment_size: '180 KB' },
  { id: '5', created_at: '2026-04-05', type: 'Cuti', start_date: '2026-04-10', end_date: '2026-04-12', reason: 'Liburan keluarga', status: 'Dibatalkan', attachment_name: null, attachment_size: null },
];

export default function IzinCutiPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formOneDay, setFormOneDay] = useState(false);
  const [formReason, setFormReason] = useState('');

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setRequests(data);
      } else {
        setRequests(DUMMY_DATA);
      }
    } catch (err) {
      console.error("Gagal dari DB, pakai dummy:", err);
      setRequests(DUMMY_DATA);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!formType || !formStartDate || (!formEndDate && !formOneDay) || !formReason) {
      alert("Harap isi semua kolom wajib!");
      return;
    }

    setIsSubmitting(true);
    const newRequest: LeaveRequest = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString().split('T')[0],
      type: formType,
      start_date: formStartDate,
      end_date: formOneDay ? formStartDate : formEndDate,
      reason: formReason,
      status: 'menunggu',
      attachment_name: null, 
      attachment_size: null,
    };

    try {
      if (profile) {
        const { error } = await supabase.from('leave_requests').insert([{
            user_id: profile.id,
            type: newRequest.type,
            start_date: newRequest.start_date,
            end_date: newRequest.end_date,
            reason: newRequest.reason,
            status: newRequest.status,
            created_at: new Date().toISOString()
        }]);
        if (error) throw error;
      }
    } catch (err) {
      console.log("DB belum siap, simpan ke lokal State");
    }

    setRequests([newRequest, ...requests]);
    setIsSubmitting(false);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormType('');
    setFormStartDate('');
    setFormEndDate('');
    setFormOneDay(false);
    setFormReason('');
  };

  const formatDateDisplay = (dateString: string) => {
    if(!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getStatusStyle = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'menunggu': return 'text-yellow-600 bg-yellow-100';
      case 'disetujui': return 'text-green-600 bg-green-200';
      case 'ditolak': return 'text-red-600 bg-red-200';
      case 'dibatalkan': return 'text-gray-600 bg-gray-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] font-sans pb-10">

      <div className="px-3 lg:px-6 pt-6">
        
        {/* Banner Informasi & Tombol Ajukan */}
        <div className="bg-[#eff4ff] border border-[#dbeafe] rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-blue-700 font-semibold text-sm">Informasi</p>
              <p className="text-blue-600 text-sm mt-0.5">Ajukan izin atau cuti minimal 1 hari sebelum tanggal pelaksanaan.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajukan Izin / Cuti Baru
          </button>
        </div>

        {/* Tab "Pengajuan Saya" */}
        <div className="border-b border-gray-200 mb-6 flex">
            <button className="border-b-2 border-blue-600 text-blue-600 font-semibold text-sm pb-3 px-4">Pengajuan Saya</button>
        </div>

        {/* Filter Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
            <div className="flex gap-3 w-full lg:w-auto">
                <div className="relative w-full lg:w-40">
                    <span className="absolute left-3 top-[-8px] bg-[#f4f7fb] px-1 text-[10px] text-gray-500">Status</span>
                    <select className="w-full bg-transparent border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none appearance-none">
                        <option>Semua status</option>
                    </select>
                </div>
                <div className="relative w-full lg:w-48">
                    <span className="absolute left-3 top-[-8px] bg-[#f4f7fb] px-1 text-[10px] text-gray-500">Jenis Pengajuan</span>
                    <select className="w-full bg-transparent border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none appearance-none">
                        <option>Semua jenis</option>
                    </select>
                </div>
                <div className="relative w-full lg:w-40">
                    <span className="absolute left-3 top-[-8px] bg-[#f4f7fb] px-1 text-[10px] text-gray-500">Periode</span>
                    <select className="w-full bg-transparent border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none appearance-none">
                        <option>10/04/2026</option>
                    </select>
                </div>
            </div>
            
            <div className="relative w-full lg:w-64">
                <input 
                    type="text" 
                    placeholder="Cari pengajuan..." 
                    className="w-full border border-gray-300 text-sm rounded-lg pl-3 pr-10 py-2 focus:outline-none bg-white shadow-sm"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
        </div>

        {/* Tabel Data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal pengajuan</th>
                <th className="px-6 py-4 whitespace-nowrap">Jenis Pengajuan</th>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal Mulai</th>
                <th className="px-6 py-4 whitespace-nowrap">Tanggal Selesai</th>
                <th className="px-6 py-4 w-64">Alasan</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Lampiran</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-gray-600 font-medium">{formatDateDisplay(req.created_at)}</td>
                  <td className="px-6 py-4 text-gray-600">{req.type}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{formatDateDisplay(req.start_date)}</td>
                  <td className="px-6 py-4 text-gray-600 font-medium">{formatDateDisplay(req.end_date)}</td>
                  <td className="px-6 py-4 text-gray-600">{req.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-[11px] font-semibold ${getStatusStyle(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      {req.attachment_name ? (
                          <div className="flex items-center gap-2">
                              {req.attachment_name.includes('.pdf') ? <FileText className="w-4 h-4 text-red-500" /> : <ImageIcon className="w-4 h-4 text-red-500" />}
                              <div>
                                  <p className="text-xs text-gray-700">{req.attachment_name}</p>
                                  <p className="text-[10px] text-gray-400">({req.attachment_size})</p>
                              </div>
                          </div>
                      ) : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                          <button className="text-gray-400 hover:text-gray-600"><Edit className="w-4 h-4" /></button>
                          <button className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
              <span className="text-sm text-gray-600 font-medium">Menampilkan 1 - 5 dari 5 data</span>
              <div className="flex items-center gap-1">
                  <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50" disabled><ChevronLeft className="w-5 h-5" /></button>
                  <button className="w-8 h-8 flex items-center justify-center rounded bg-[#eef2ff] text-[#4f46e5] font-semibold text-sm border border-[#c7d2fe]">1</button>
                  <button className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-800 disabled:opacity-50" disabled><ChevronRight className="w-5 h-5" /></button>
              </div>
          </div>
        </div>

        {/* Background "Cara Mengajukan" dari Gambar 2 */}
        <div className="bg-gray-200/50 rounded-xl p-6 border border-gray-200">
            <h3 className="font-bold text-gray-800 mb-4">Cara Mengajukan Izin / Cuti</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex gap-3 items-start">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Isi Form Pengajuan</p>
                        <p className="text-xs text-gray-500 mt-1">Pilih jenis pengajuan, isi tanggal mulai, tanggal selesai, dan alasan.</p>
                    </div>
                </div>
                <div className="flex gap-3 items-start">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Upload Dokumen</p>
                        <p className="text-xs text-gray-500 mt-1">Unggah dokumen pendukung (jika diperlukan).</p>
                    </div>
                </div>
                <div className="flex gap-3 items-start">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Kirim Pengajuan</p>
                        <p className="text-xs text-gray-500 mt-1">Periksa kembali data, lalu klik "Kirim Pengajuan".</p>
                    </div>
                </div>
                <div className="flex gap-3 items-start">
                    <div className="bg-blue-600 text-white w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm">4</div>
                    <div>
                        <p className="font-bold text-gray-800 text-sm">Menunggu Persetujuan</p>
                        <p className="text-xs text-gray-500 mt-1">Pengajuan akan diproses oleh admin. Cek status secara berkala.</p>
                    </div>
                </div>
            </div>
        </div>

      </div>

      {/* --- MODAL POP UP AJUKAN BARU (DIPERBAIKI) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          
          {/* PERUBAHAN UTAMA: Tambah max-h-[90vh] dan flex-col agar modal tidak lewat layar */}
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header (Tetap di Atas) */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-xl text-gray-900">Ajukan Izin / Cuti Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Bisa Di-Scroll Jika Layar Kecil) */}
            <div className="p-5 space-y-4 overflow-y-auto">
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Jenis Pengajuan <span className="text-red-500">*</span></label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 bg-white"
                  value={formType}
                  onChange={e => setFormType(e.target.value)}
                >
                  <option value="">Pilih jenis pengajuan</option>
                  <option value="Izin">Izin</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Cuti">Cuti</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Mulai <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                      value={formStartDate}
                      onChange={e => setFormStartDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tanggal Selesai <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 disabled:bg-gray-100"
                      value={formEndDate}
                      onChange={e => setFormEndDate(e.target.value)}
                      disabled={formOneDay}
                    />
                    <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="oneday" 
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={formOneDay}
                          onChange={(e) => {
                              setFormOneDay(e.target.checked);
                              if(e.target.checked) setFormEndDate('');
                          }}
                        />
                        <label htmlFor="oneday" className="text-sm text-gray-600">Satu hari saja</label>
                    </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alasan <span className="text-red-500">*</span></label>
                <textarea 
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 resize-none"
                  placeholder="Jelaskan alasan pengajuan izin atau cuti..."
                  value={formReason}
                  onChange={e => setFormReason(e.target.value)}
                  maxLength={500}
                ></textarea>
                <p className="text-right text-xs text-gray-400 mt-1">{formReason.length} / 500</p>
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dokumen Pendukung (Opsional)</label>
                  <div className="border-2 border-dashed border-blue-200 bg-[#f4f7fb] rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 transition-colors">
                      <div className="bg-white p-2 rounded-full shadow-sm mb-2">
                          <UploadCloud className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-800">Klik untuk upload atau seret file ke sini</p>
                      <p className="text-xs text-gray-500 mt-1">Format: PDF, JPG, PNG (Maks. 5 MB)</p>
                  </div>
              </div>
              
              <p className="text-xs text-gray-500"><span className="text-red-500">*</span> Wajib diisi</p>
            </div>

            {/* Modal Footer (Tetap di Bawah) */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50 shrink-0">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-[#2563eb] hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm transition-colors"
                disabled={isSubmitting}
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Memproses...' : 'Kirim Pengajuan'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}