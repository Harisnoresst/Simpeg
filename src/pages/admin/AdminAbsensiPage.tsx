import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AdminAbsensiPage() {
  const [attendances, setAttendances] = useState([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase.from('attendances').select('*, profiles(full_name)').eq('date', today).order('created_at', { ascending: false }).limit(20).then(r => setAttendances(r.data || []));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Absensi Guru</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Nama Guru</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Jam Masuk</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {attendances.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Belum ada data absensi hari ini</td></tr>
              ) : attendances.map((att: any) => (
                <tr key={att.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{att.profiles?.full_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{att.check_in_time || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${att.status === 'hadir' ? 'text-green-700 bg-green-100' : att.status === 'terlambat' ? 'text-yellow-700 bg-yellow-100' : 'text-gray-700 bg-gray-100'}`}>{att.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
