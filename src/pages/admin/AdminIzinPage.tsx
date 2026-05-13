import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
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
  status: 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Dibatalkan';
  lampiran_nama: string | null;
  lampiran_ukuran: string | null;
  catatan: string | null;
};

// --- DATA DUMMY ---
const DUMMY_DATA: LeaveRequest[] = [
  { id: '1', nama_guru: 'Siti Nurhaliza, S.Pd', nip: '199205152019032008', avatar_url: 'https://i.pravatar.cc/150?img=5', subject: 'Guru Bahasa Indonesia', jenis_pengajuan: 'Izin', tanggal_pengajuan: '20 Mei 2026 10:15 WIB', periode: '21 Mei 2026 s.d. 21 Mei 2026', alasan: 'Izin karena sakit dan perlu istirahat di rumah.', status: 'Menunggu', lampiran_nama: 'surat_dokter.pdf', lampiran_ukuran: '245 KB', catatan: '' },
  { id: '2', nama_guru: 'Ahmad Fauzi, S.Pd', nip: '198805102015041002', avatar_url: 'https://i.pravatar.cc/150?img=11', subject: 'Guru Matematika', jenis_pengajuan: 'Cuti', tanggal_pengajuan: '10 Mei 2026 09:41 WIB', periode: '12 Mei 2026 s.d. 14 Mei 2026', alasan: 'Cuti karena urusan keluarga.', status: 'Disetujui', lampiran_nama: 'surat_cuti.pdf', lampiran_ukuran: '312 KB', catatan: '' },
  { id: '3', nama_guru: 'Dewi Lestari, S.Pd', nip: '199001122016042001', avatar_url: 'https://i.pravatar.cc/150?img=9', subject: 'Guru Bahasa Inggris', jenis_pengajuan: 'Sakit', tanggal_pengajuan: '02 Mei 2026 08:30 WIB', periode: '02 Mei 2026 s.d. 03 Mei 2026', alasan: 'Sakit demam tinggi.', status: 'Ditolak', lampiran_nama: null, lampiran_ukuran: null, catatan: '' },
];

export default function AdminIzinPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [filteredData, setFilteredData] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State UI
  const [activeTab, setActiveTab] = useState<'Daftar Pengajuan' | 'Riwayat Pengajuan'>('Daftar Pengajuan');
  const [selectedInline, setSelectedInline] = useState<LeaveRequest | null>(null); // Untuk detail bawah
  const [selectedModal, setSelectedModal] = useState<LeaveRequest | null>(null); // Untuk pop-up modal
  const [catatan, setCatatan] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    setFilteredData(activeTab === 'Daftar Pengajuan' ? data.filter(i => i.status === 'Menunggu') : data.filter(i => i.status !== 'Menunggu'));
    setSelectedInline(null);
  }, [activeTab, data]);

  async function loadData() {
    setIsLoading(true);
    try {
      const { data: dbData } = await supabase.from('leave_requests').select('*, profiles(*)').order('created_at', { ascending: false });
      if (dbData) setData(dbData as any); else throw new Error();
    } catch { setData(DUMMY_DATA); } finally { setIsLoading(false); }
  }

  const handleAction = async (status: 'Disetujui' | 'Ditolak', reqId: string) => {
    setIsProcessing(true);
    const updatedData = data.map(item => item.id === reqId ? { ...item, status, catatan } : item);
    setData(updatedData);
    setIsProcessing(false);
    setSelectedModal(null);
    setSelectedInline(null);
    setCatatan('');
  };

  const getJenisIcon = (jenis: string) => {
    const style = "p-1.5 rounded shrink-0";
    if (jenis === 'Izin') return <div className="flex items-center gap-2"><div className={`${style} bg-blue-50 text-blue-500`}><FileText size={16}/></div><span className="font-semibold text-gray-700">Izin</span></div>;
    if (jenis === 'Cuti') return <div className="flex items-center gap-2"><div className={`${style} bg-green-50 text-green-500`}><Briefcase size={16}/></div><span className="font-semibold text-gray-700">Cuti</span></div>;
    return <div className="flex items-center gap-2"><div className={`${style} bg-orange-50 text-orange-500`}><HeartPulse size={16}/></div><span className="font-semibold text-gray-700">Sakit</span></div>;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-10">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center mb-6">
        <h1 className="text-[22px] font-bold text-gray-900">Izin dan Cuti</h1>
        <div className="flex items-center gap-6">
          <div className="relative"><Bell className="text-gray-600"/><span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">3</span></div>
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/150?img=11" className="w-9 h-9 rounded-full object-cover" />
            <div className="text-right leading-tight"><p className="text-sm font-semibold text-gray-900">Admin Dinas</p><p className="text-[11px] text-gray-500">Administrator</p></div>
          </div>
        </div>
      </div>

      <div className="px-8 space-y-6">
        {/* TABS */}
        <div className="flex justify-between items-end border-b border-gray-200">
          <div className="flex gap-8">
            {['Daftar Pengajuan', 'Riwayat Pengajuan'].map((t: any) => (
              <button key={t} onClick={() => setActiveTab(t)} className={`pb-4 text-[14px] font-bold transition-colors ${activeTab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>{t}</button>
            ))}
          </div>
          <button className="mb-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-[13px] font-bold flex items-center gap-2 shadow-sm"><Filter size={16}/> Filter</button>
        </div>

        {/* TABEL */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-white text-gray-700 font-bold border-b">
                <tr><th className="px-6 py-4 w-12">No</th><th>Nama Guru</th><th>Jenis</th><th>Tanggal</th><th>Periode</th><th>Alasan</th><th className="text-center">Status</th><th>Lampiran</th><th className="text-center">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600 font-medium">
                {filteredData.map((item, index) => (
                  <tr key={item.id} onClick={() => { setSelectedInline(item); setCatatan(item.catatan || ''); }} className={`cursor-pointer transition-colors ${selectedInline?.id === item.id ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={item.avatar_url || ''} className="w-9 h-9 rounded-full object-cover" />
                        <div><p className="font-bold text-gray-900 text-[13px]">{item.nama_guru.split(',')[0]}</p><p className="text-[10px] text-gray-500">NIP. {item.nip}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getJenisIcon(item.jenis_pengajuan)}</td>
                    <td className="px-6 py-4 whitespace-pre-line">{item.tanggal_pengajuan.replace(' ', '\n')}</td>
                    <td className="px-6 py-4 whitespace-pre-line">{item.periode.replace(' s.d. ', '\ns.d. ')}</td>
                    <td className="px-6 py-4">{item.alasan}</td>
                    <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${item.status === 'Menunggu' ? 'bg-[#fef9c3] text-[#ca8a04]' : 'bg-[#dcfce7] text-[#166534]'}`}>{item.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.lampiran_nama && <div className="flex items-center gap-2"><FileText size={16} className="text-red-500"/><div><p className="text-[11px] font-bold text-gray-800">{item.lampiran_nama}</p></div></div>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedModal(item); setCatatan(item.catatan || ''); }} 
                        className="text-gray-400 hover:text-gray-800 border border-gray-200 p-1.5 rounded shadow-sm"
                      >
                        <MoreVertical size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
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
                  <img src={selectedInline.avatar_url || ''} className="w-16 h-16 rounded-full object-cover border shrink-0" />
                  <div className="flex-1 space-y-2 text-[12px]">
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold">Nama</span><span>:</span><span>{selectedInline.nama_guru}</span></div>
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold">NIP</span><span>:</span><span>{selectedInline.nip}</span></div>
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold">Jenis</span><span>:</span><span>{selectedInline.jenis_pengajuan}</span></div>
                    <div className="grid grid-cols-[110px_10px_1fr]"><span className="font-bold">Tanggal</span><span>:</span><span>{selectedInline.tanggal_pengajuan}</span></div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-5">Lampiran</h4>
                {selectedInline.lampiran_nama ? (
                  <div className="flex justify-between items-center p-3.5 border rounded-lg shadow-sm">
                    <div className="flex items-center gap-3"><FileText className="text-red-500"/><div><p className="text-[12px] font-bold">{selectedInline.lampiran_nama}</p></div></div>
                    <button className="text-blue-600 border border-blue-100 px-3 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5"><Eye size={14}/> Lihat File</button>
                  </div>
                ) : <p className="text-gray-400 italic text-center p-4">Tidak ada lampiran</p>}
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-5">Tindakan</h4>
                <div className="flex gap-2 mb-4">
                  <button onClick={() => handleAction('Disetujui', selectedInline.id)} className="flex-1 bg-[#16a34a] text-white font-bold text-[12px] py-2.5 rounded shadow-sm flex items-center justify-center gap-1.5"><Check size={16}/> Setujui</button>
                  <button onClick={() => handleAction('Ditolak', selectedInline.id)} className="flex-1 bg-[#dc2626] text-white font-bold text-[12px] py-2.5 rounded shadow-sm flex items-center justify-center gap-1.5"><X size={16}/> Tolak</button>
                </div>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Tulis catatan..." className="w-full border rounded-lg p-3 text-[12px] focus:border-blue-500 resize-none h-[80px]" />
                <div className="flex justify-end mt-3"><button className="bg-[#2563eb] text-white font-bold text-[12px] py-2 px-4 rounded-md flex items-center gap-1.5 shadow-sm"><Save size={16}/> Simpan Catatan</button></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* POP-UP MODAL (DESAIN 3 KOLOM) */}
      {selectedModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f8fafc] rounded-xl shadow-2xl w-full max-w-[1100px] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 bg-white border-b"><h3 className="font-bold text-lg">Review Pengajuan</h3><button onClick={() => setSelectedModal(null)} className="text-gray-400 hover:text-red-500"><X size={24}/></button></div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold mb-6">Detail pengajuan</h4>
                  <div className="flex items-center gap-4 mb-8 pb-6 border-b">
                    <img src={selectedModal.avatar_url || ''} className="w-16 h-16 rounded-full border" />
                    <div><h5 className="font-bold text-[18px]">{selectedModal.nama_guru.split(',')[0]}</h5><p className="text-[12px] text-gray-500">NIP.{selectedModal.nip}</p></div>
                  </div>
                  <div className="space-y-4 text-[13px]"><p><b>Jenis:</b> {selectedModal.jenis_pengajuan}</p><p><b>Periode:</b> {selectedModal.periode}</p><p><b>Alasan:</b> {selectedModal.alasan}</p></div>
                </div>
                <div className="bg-white border rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold mb-6">Lampiran</h4>
                  {selectedModal.lampiran_nama ? (
                    <div className="flex justify-between items-center bg-gray-50 p-4 border rounded-lg">
                      <div className="flex items-center gap-3"><FileText className="text-red-500"/><p className="text-[13px] font-bold">{selectedModal.lampiran_nama}</p></div>
                      <button className="p-2 hover:bg-gray-200 rounded"><Download size={20}/></button>
                    </div>
                  ) : <div className="py-10 text-center text-gray-400 border-2 border-dashed rounded-lg">Kosong</div>}
                </div>
                <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col">
                  <h4 className="font-bold mb-6">Tindakan</h4>
                  <div className="flex gap-2 mb-6">
                    <button onClick={() => handleAction('Disetujui', selectedModal.id)} className="flex-1 bg-[#22c55e] text-white font-bold py-2.5 rounded shadow-sm">Setujui</button>
                    <button onClick={() => handleAction('Ditolak', selectedModal.id)} className="flex-1 bg-[#ef4444] text-white font-bold py-2.5 rounded shadow-sm">Tolak</button>
                  </div>
                  <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} className="w-full flex-1 border rounded-lg p-3 text-[13px] resize-none" placeholder="Catatan..." />
                </div>
              </div>
              <div className="mt-6 bg-[#eef2ff] border border-[#c7d2fe] rounded-lg p-4 text-[13px] font-semibold text-blue-800 text-center shadow-sm">Pengajuan ini akan otomatis dikirim ke riwayat setelah disetujui atau ditolak</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}