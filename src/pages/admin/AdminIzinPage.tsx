import { useEffect, useState } from 'react';
import api from '../../lib/axios'; // <-- Gunakan axios
import { useAuth } from '../../contexts/AuthContext';
import { 
  Bell, FileText, CheckCircle2, XCircle, Clock, 
  MoreVertical, Briefcase, HeartPulse, Filter, 
  ChevronLeft, ChevronRight, X, Check, Eye, Undo, Save, Download
} from 'lucide-react';

// --- TIPE DATA ---
type LeaveRequest = {
  id: string;
  nama_guru: string;
  nip: string;
  avatar_url: string | null;
  subject: string;
  jenis_pengajuan: 'Izin' | 'Cuti' | 'Sakit';
  tanggal_pengajuan: string;
  periode: string;
  alasan: string;
  status: 'menunggu' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  lampiran_nama: string | null;
  lampiran_ukuran: string | null;
  lampiran_url: string | null; // Tambahan untuk link file
  catatan: string | null;
};

export default function AdminIzinPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [filteredData, setFilteredData] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [activeTab, setActiveTab] = useState<'Daftar Pengajuan' | 'Riwayat Pengajuan'>('Daftar Pengajuan');
  const [selectedInline, setSelectedInline] = useState<LeaveRequest | null>(null); 
  const [selectedModal, setSelectedModal] = useState<LeaveRequest | null>(null); 
  const [catatan, setCatatan] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    // Filter data berdasarkan tab aktif
    setFilteredData(activeTab === 'Daftar Pengajuan' 
      ? data.filter(i => i.status.toLowerCase() === 'menunggu') 
      : data.filter(i => i.status.toLowerCase() !== 'menunggu')
    );
    setSelectedInline(null);
  }, [activeTab, data]);

  async function loadData() {
    setIsLoading(true);
    try {
      const response = await api.get('/admin/leave-requests');
      
      // Mapping format data backend ke frontend
      const mappedData: LeaveRequest[] = response.data.map((item: any) => {
          // Format Tanggal
          const dCreate = new Date(item.created_at);
          const tglPengajuan = `${dCreate.getDate()} ${dCreate.toLocaleString('id-ID',{month:'short'})} ${dCreate.getFullYear()} ${dCreate.getHours().toString().padStart(2,'0')}:${dCreate.getMinutes().toString().padStart(2,'0')} WIB`;
          
          const dStart = new Date(item.start_date);
          const dEnd = new Date(item.end_date);
          const strStart = `${dStart.getDate()} ${dStart.toLocaleString('id-ID',{month:'short'})} ${dStart.getFullYear()}`;
          const strEnd = `${dEnd.getDate()} ${dEnd.toLocaleString('id-ID',{month:'short'})} ${dEnd.getFullYear()}`;

          return {
              id: item.id.toString(),
              nama_guru: item.name || 'Tanpa Nama',
              nip: item.nip || '-',
              avatar_url: item.avatar_url || null,
              subject: item.subject || '-',
              jenis_pengajuan: item.type,
              tanggal_pengajuan: tglPengajuan,
              periode: `${strStart} s.d. ${strEnd}`,
              alasan: item.reason,
              status: item.status,
              lampiran_nama: item.attachment_name,
              lampiran_ukuran: item.attachment_size,
              lampiran_url: item.attachment_url,
              catatan: item.catatan || ''
          };
      });

      setData(mappedData);
    } catch (err) { 
      console.error("Gagal load data", err);
    } finally { 
      setIsLoading(false); 
    }
  }

  // --- LOGIKA SETUJUI / TOLAK (MENGUBAH DATABASE) ---
  const handleAction = async (status: 'Disetujui' | 'Ditolak', reqId: string) => {
    setIsProcessing(true);
    try {
        await api.put(`/admin/leave-requests/${reqId}`, { status, catatan });
        

        const updatedData = data.map(item => item.id === reqId ? { ...item, status, catatan } : item);
        setData(updatedData);
    } catch (err) {
    } finally {
        setIsProcessing(false);
        setSelectedModal(null);
        setSelectedInline(null);
        setCatatan('');
    }
  };

  // --- LOGIKA SIMPAN CATATAN SAJA ---
  const handleSaveCatatan = async (reqId: string) => {
      try {
          const req = data.find(d => d.id === reqId);
          if(!req) return;
          await api.put(`/admin/leave-requests/${reqId}`, { status: req.status, catatan });
          
          const updatedData = data.map(item => item.id === reqId ? { ...item, catatan } : item);
          setData(updatedData);
      } catch (err) {
      }
  };

  const getJenisIcon = (jenis: string) => {
    const style = "p-1.5 rounded shrink-0";
    if (jenis === 'Izin') return <div className="flex items-center gap-2"><div className={`${style} bg-blue-50 text-blue-500`}><FileText size={16}/></div><span className="font-semibold text-gray-700">Izin</span></div>;
    if (jenis === 'Cuti') return <div className="flex items-center gap-2"><div className={`${style} bg-green-50 text-green-500`}><Briefcase size={16}/></div><span className="font-semibold text-gray-700">Cuti</span></div>;
    return <div className="flex items-center gap-2"><div className={`${style} bg-orange-50 text-orange-500`}><HeartPulse size={16}/></div><span className="font-semibold text-gray-700">Sakit</span></div>;
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-10">
      <div className="px-8 pt-6 space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200">
          <div className="flex gap-8">
            {['Daftar Pengajuan', 'Riwayat Pengajuan'].map((t: any) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`pb-4 text-[14px] font-bold transition-colors ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>{t}</button>
            ))}
          </div>
          <button className="mb-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-[13px] font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition-colors"><Filter size={16}/> Filter</button>
        </div>

        {/* TABEL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-white text-gray-700 font-bold border-b">
                <tr><th className="px-6 py-4 w-12">No</th><th>Nama Guru</th><th>Jenis</th><th>Tanggal</th><th>Periode</th><th>Alasan</th><th className="text-center">Status</th><th>Lampiran</th><th className="text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                {isLoading ? (
                    <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Menarik data pengajuan dari database...</td></tr>
                ) : filteredData.length === 0 ? (
                    <tr><td colSpan={9} className="px-6 py-10 text-center text-gray-400">Tidak ada data {activeTab.toLowerCase()}.</td></tr>
                ) : (
                    filteredData.map((item, index) => (
                    <tr key={item.id} onClick={() => { setSelectedInline(item); setCatatan(item.catatan || ''); }} className={`cursor-pointer transition-colors ${selectedInline?.id === item.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4">{index + 1}</td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            {item.avatar_url ? <img src={item.avatar_url} className="w-9 h-9 rounded-full object-cover shadow-sm" /> : <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-400">{item.nama_guru.charAt(0)}</div>}
                            <div><p className="font-bold text-gray-900 text-[13px]">{item.nama_guru.split(',')[0]}</p><p className="text-[10px] text-gray-500">NIP. {item.nip}</p></div>
                        </div>
                        </td>
                        <td className="px-6 py-4">{getJenisIcon(item.jenis_pengajuan)}</td>
                        <td className="px-6 py-4 whitespace-pre-line">{item.tanggal_pengajuan.replace(' ', '\n')}</td>
                        <td className="px-6 py-4 whitespace-pre-line">{item.periode.replace(' s.d. ', '\ns.d. ')}</td>
                        <td className="px-6 py-4">{item.alasan}</td>
                        <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                                item.status.toLowerCase() === 'menunggu' ? 'bg-[#fef9c3] text-[#ca8a04]' : 
                                item.status === 'Disetujui' ? 'bg-[#dcfce7] text-[#166534]' : 
                                'bg-red-100 text-red-700'
                            }`}>{capitalize(item.status)}</span>
                        </td>
                        <td className="px-6 py-4">
                        {item.lampiran_nama && <div className="flex items-center gap-2"><FileText size={16} className="text-red-500"/><div><p className="text-[11px] font-bold text-gray-800 line-clamp-1 max-w-[100px]">{item.lampiran_nama}</p></div></div>}
                        </td>
                        <td className="px-6 py-4 text-center">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setSelectedModal(item); setCatatan(item.catatan || ''); }} 
                            className="text-gray-400 hover:text-gray-800 border border-gray-200 p-1.5 rounded shadow-sm bg-white"
                        >
                            <MoreVertical size={16}/>
                        </button>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETAIL BAWAH (INLINE) */}
        {selectedInline && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-5">Detail Pengajuan</h4>
                <div className="flex items-start gap-4">
                  {selectedInline.avatar_url ? <img src={selectedInline.avatar_url} className="w-16 h-16 rounded-full object-cover border shrink-0" /> : <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0 border"></div>}
                  <div className="flex-1 space-y-2 text-[12px]">
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold text-gray-600">Nama</span><span>:</span><span className="font-semibold text-gray-900">{selectedInline.nama_guru}</span></div>
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold text-gray-600">NIP</span><span>:</span><span className="font-semibold text-gray-900">{selectedInline.nip}</span></div>
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold text-gray-600">Jenis</span><span>:</span><span className="font-semibold text-gray-900">{selectedInline.jenis_pengajuan}</span></div>
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold text-gray-600">Tanggal</span><span>:</span><span className="font-semibold text-gray-900">{selectedInline.tanggal_pengajuan}</span></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-5">Lampiran</h4>
                {selectedInline.lampiran_nama ? (
                  <div className="flex justify-between items-center p-3.5 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                    <div className="flex items-center gap-3"><FileText className="text-red-500 w-8 h-8"/><div><p className="text-[12px] font-bold text-gray-800 line-clamp-1">{selectedInline.lampiran_nama}</p></div></div>
                    {selectedInline.lampiran_url && (
                        <button onClick={() => window.open(selectedInline.lampiran_url || '', '_blank')} className="text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-colors shrink-0"><Eye size={14}/> Buka File</button>
                    )}
                  </div>
                ) : <p className="text-gray-400 italic text-center p-4 border border-dashed rounded-lg">Tidak ada lampiran disertakan</p>}
              </div>
              <div className="flex flex-col">
                <h4 className="text-[15px] font-bold text-gray-900 mb-5">Tindakan</h4>
                
                {selectedInline.status.toLowerCase() === 'menunggu' && (
                    <div className="flex gap-2 mb-4">
                        <button disabled={isProcessing} onClick={() => handleAction('Disetujui', selectedInline.id)} className="flex-1 bg-[#16a34a] hover:bg-green-700 text-white font-bold text-[12px] py-2.5 rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors"><Check size={16}/> Setujui</button>
                        <button disabled={isProcessing} onClick={() => handleAction('Ditolak', selectedInline.id)} className="flex-1 bg-[#dc2626] hover:bg-red-700 text-white font-bold text-[12px] py-2.5 rounded shadow-sm flex items-center justify-center gap-1.5 transition-colors"><X size={16}/> Tolak</button>
                    </div>
                )}
                
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tulis pesan/catatan untuk guru ini..." className="w-full flex-1 border border-gray-200 rounded-lg p-3 text-[12px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none h-[80px]" />
                <div className="flex justify-end mt-3">
                    <button onClick={() => handleSaveCatatan(selectedInline.id)} disabled={isProcessing} className="bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-[12px] py-2 px-4 rounded-md flex items-center gap-1.5 shadow-sm transition-colors"><Save size={16}/> Simpan Catatan</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POP-UP MODAL (DESAIN 3 KOLOM) */}
      {selectedModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f8fafc] rounded-2xl shadow-2xl w-full max-w-[1100px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 bg-white border-b"><h3 className="font-bold text-lg text-gray-800">Review Pengajuan</h3><button onClick={() => setSelectedModal(null)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"><X size={24}/></button></div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-6 border-b pb-2">Detail pengajuan</h4>
                  <div className="flex items-center gap-4 mb-6">
                    {selectedModal.avatar_url ? <img src={selectedModal.avatar_url} className="w-16 h-16 rounded-full border shadow-sm object-cover" /> : <div className="w-16 h-16 rounded-full bg-gray-200 border"></div>}
                    <div><h5 className="font-bold text-[16px] text-gray-900">{selectedModal.nama_guru.split(',')[0]}</h5><p className="text-[12px] text-gray-500 font-medium">NIP.{selectedModal.nip}</p></div>
                  </div>
                  <div className="space-y-4 text-[13px] bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p><b className="text-gray-600 block mb-0.5">Jenis:</b> <span className="font-semibold text-gray-900">{selectedModal.jenis_pengajuan}</span></p>
                      <p><b className="text-gray-600 block mb-0.5">Periode:</b> <span className="font-semibold text-gray-900">{selectedModal.periode}</span></p>
                      <p><b className="text-gray-600 block mb-0.5">Alasan:</b> <span className="font-semibold text-gray-900 leading-relaxed">{selectedModal.alasan}</span></p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-6 border-b pb-2">Lampiran</h4>
                  {selectedModal.lampiran_nama ? (
                    <div className="flex justify-between items-center bg-blue-50/50 p-4 border border-blue-100 rounded-lg">
                      <div className="flex items-center gap-3 overflow-hidden"><FileText className="text-red-500 shrink-0"/><p className="text-[13px] font-bold text-gray-800 truncate">{selectedModal.lampiran_nama}</p></div>
                      {selectedModal.lampiran_url && (
                          <button onClick={() => window.open(selectedModal.lampiran_url || '', '_blank')} className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors shrink-0" title="Buka File"><Download size={20}/></button>
                      )}
                    </div>
                  ) : <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-200 bg-gray-50 rounded-lg flex flex-col items-center gap-2"><FileText size={32} className="text-gray-300"/> Tidak ada file lampiran</div>}
                </div>
                
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm flex flex-col">
                  <h4 className="font-bold text-gray-800 mb-6 border-b pb-2">Tindakan Admin</h4>
                  
                  {selectedModal.status.toLowerCase() === 'menunggu' && (
                      <div className="flex gap-3 mb-6">
                        <button disabled={isProcessing} onClick={() => handleAction('Disetujui', selectedModal.id)} className="flex-1 bg-[#22c55e] hover:bg-green-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"><Check size={18}/> Setujui</button>
                        <button disabled={isProcessing} onClick={() => handleAction('Ditolak', selectedModal.id)} className="flex-1 bg-[#ef4444] hover:bg-red-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"><X size={18}/> Tolak</button>
                      </div>
                  )}
                  
                  <div className="flex-1 flex flex-col">
                      <label className="text-[12px] font-bold text-gray-600 mb-2">Catatan / Pesan untuk Guru (Opsional)</label>
                      <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full flex-1 border border-gray-300 rounded-lg p-3 text-[13px] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors" placeholder="Tuliskan alasan penolakan atau pesan persetujuan di sini..." />
                  </div>

                  {selectedModal.status.toLowerCase() !== 'menunggu' && (
                      <button onClick={() => handleSaveCatatan(selectedModal.id)} disabled={isProcessing} className="w-full mt-4 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-[12px] py-2.5 rounded-lg shadow-sm transition-colors">Simpan Catatan Saja</button>
                  )}
                </div>
              </div>
              
              <div className="mt-6 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-4 text-[13px] font-semibold text-[#1e40af] text-center shadow-sm flex items-center justify-center gap-2">
                  <Bell size={16} /> Pemberitahuan status dan catatan ini akan otomatis muncul di aplikasi Guru yang bersangkutan.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}