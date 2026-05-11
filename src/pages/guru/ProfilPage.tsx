import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilPage() {
  const { profile } = useAuth();
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Profil Saya</h2>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-8 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white flex items-center justify-center mb-3">
            <span className="text-3xl font-bold text-white">{profile?.full_name?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <p className="text-white font-bold text-lg">{profile?.full_name}</p>
          <p className="text-blue-200 text-sm capitalize">{profile?.role}</p>
        </div>

        <form className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
            <input type="text" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">NIP</label>
            <input type="text" value={profile?.nip || ''} disabled className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telepon</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="button" className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            Simpan
          </button>
        </form>
      </div>
    </div>
  );
}
