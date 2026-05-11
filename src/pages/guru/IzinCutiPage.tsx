import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function IzinCutiPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Izin & Cuti</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />
          Ajukan Permohonan
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
        <p className="text-gray-400">Fitur Izin & Cuti sedang dikembangkan</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-gray-800 mb-4">Ajukan Permohonan</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Permohonan</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Izin</option>
                  <option>Sakit</option>
                  <option>Cuti Tahunan</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Batal</button>
                <button className="flex-1 bg-blue-700 text-white py-2 rounded-lg text-sm hover:bg-blue-800">Ajukan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
