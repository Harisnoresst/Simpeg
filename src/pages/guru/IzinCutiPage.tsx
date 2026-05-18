import { useEffect, useState, useRef } from 'react';
import api from '../../lib/axios'; 
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, Bell, Plus, Info, Search, FileText, Edit, Trash2, 
  X, UploadCloud, Send, ChevronLeft, ChevronRight, Image as ImageIcon
} from 'lucide-react';

type LeaveRequest = {
  id: number;
  created_at: string; 
  type: string; 
  start_date: string;
  end_date: string;
  reason: string;
  status: 'menunggu' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  attachment_name: string | null;
  attachment_size: string | null;
  attachment_url: string | null;
};

export default function IzinCutiPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formType, setFormType] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formOneDay, setFormOneDay] = useState(false);
  const [formReason, setFormReason] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null); 
  
  // State untuk melacak aktivitas Drag and Drop
  const [isDragActive, setIsDragActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) loadData();
  }, [profile]);

  async function loadData() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/leave-requests');
      setRequests(data);
    } catch (err) {
      console.error("Gagal mengambil data dari database:", err);
    } finally {
      setIsLoading(false);
    }
  }

  // --- LOGIKA VALIDASI FILE (Digunakan untuk Klik dan Drag & Drop) ---
  const validateAndSetFile = (file: File) => {
    // Validasi tipe file (opsional tapi disarankan untuk drag and drop)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung! Gunakan PDF, JPG, atau PNG.");
      return;
    }
    
    // Validasi ukuran
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5 MB!");
      return;
    }
    
    setFormFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  // --- EVENT HANDLER DRAG AND DROP ---
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!formType || !formStartDate || (!formEndDate && !formOneDay) || !formReason) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('type', formType);
      formData.append('start_date', formStartDate);
      formData.append('end_date', formOneDay ? formStartDate : formEndDate);
      formData.append('reason', formReason);
      if (formFile) {
        formData.append('attachment', formFile);
      }

      await api.post('/leave-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      resetForm();
      loadData(); 
    } catch (err: any) {
      alert("Gagal mengirim pengajuan: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormType('');
    setFormStartDate('');
    setFormEndDate('');
    setFormOneDay(false);
    setFormReason('');
    setFormFile(null);
    setIsDragActive(false);
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

        <div className="border-b border-gray-200 mb-6 flex">
            <button className="border-b-2 border-blue-600 text-blue-600 font-semibold text-sm pb-3 px-4">Pengajuan Saya</button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#f8fafc] text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Tgl. Pengajuan</th>
                <th className="px-6 py-4 whitespace-nowrap">Jenis</th>
                <th className="px-6 py-4 whitespace-nowrap">Tgl. Mulai</th>
                <th className="px-6 py-4 whitespace-nowrap">Tgl. Selesai</th>
                <th className="px-6 py-4 w-64">Alasan</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap">Lampiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Memuat data...</td></tr>
              ) : requests.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat pengajuan.</td></tr>
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
                          <a href={req.attachment_url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded transition-colors">
                              {req.attachment_name.includes('.pdf') ? <FileText className="w-4 h-4 text-red-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                              <div>
                                  <p className="text-xs text-blue-600 hover:underline">{req.attachment_name.length > 15 ? req.attachment_name.substring(0, 15) + '...' : req.attachment_name}</p>
                                  <p className="text-[10px] text-gray-400">({req.attachment_size})</p>
                              </div>
                          </a>
                      ) : <span className="text-gray-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-xl text-gray-900">Ajukan Izin / Cuti Baru</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

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
                        <label htmlFor="oneday" className="text-sm text-gray-600 cursor-pointer">Satu hari saja</label>
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
              </div>

              {/* AREA DRAG AND DROP */}
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dokumen Pendukung (Opsional)</label>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDragActive 
                        ? 'border-blue-500 bg-blue-100 scale-[1.02]' 
                        : formFile 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-blue-200 bg-[#f4f7fb] hover:bg-blue-50/50'
                    }`}
                  >
                      {formFile ? (
                        <>
                          <div className="bg-white p-2 rounded-full shadow-sm mb-2"><FileText className="w-5 h-5 text-green-500" /></div>
                          <p className="text-sm font-semibold text-green-700">{formFile.name}</p>
                          <p className="text-xs text-green-600 mt-1">{(formFile.size / 1024).toFixed(0)} KB (Klik atau Tarik file lain untuk ganti)</p>
                        </>
                      ) : (
                        <>
                          <div className={`p-2 rounded-full shadow-sm mb-2 transition-colors ${isDragActive ? 'bg-blue-500 text-white' : 'bg-white text-blue-500'}`}>
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <p className={`text-sm font-semibold ${isDragActive ? 'text-blue-700' : 'text-gray-800'}`}>
                            {isDragActive ? 'Lepaskan file di sini...' : 'Klik atau Tarik file ke area ini'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Format: PDF, JPG, PNG (Maks. 5 MB)</p>
                        </>
                      )}
                  </div>
              </div>
              
              <p className="text-xs text-gray-500"><span className="text-red-500">*</span> Wajib diisi</p>
            </div>

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