import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { supabase, Profile } from '../../lib/supabase';

export default function AdminGuruPage() {
  const [gurus, setGurus] = useState<Profile[]>([]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(20).then(r => setGurus(r.data || []));
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Data Guru</h2>
        <button className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />
          Tambah Guru
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">NIP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Mapel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {gurus.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Belum ada data guru</td></tr>
              ) : gurus.map(guru => (
                <tr key={guru.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800 font-medium">{guru.full_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{guru.nip || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{guru.subject || '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${guru.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{guru.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
