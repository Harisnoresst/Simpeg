import { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalGuru: 0, hadirHariIni: 0, tidakHadir: 0, terlambat: 0 });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
      supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'guru'),
      supabase.from('attendances').select('*').eq('date', today),
    ]).then(([g, a]) => {
      const atts = a.data || [];
      setStats({
        totalGuru: g.count || 0,
        hadirHariIni: atts.filter(x => ['hadir', 'terlambat'].includes(x.status)).length,
        tidakHadir: atts.filter(x => x.status === 'tidak_hadir').length,
        terlambat: atts.filter(x => x.status === 'terlambat').length,
      });
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Dashboard Admin</h2>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Guru', value: stats.totalGuru, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Hadir Hari Ini', value: stats.hadirHariIni, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tidak Hadir', value: stats.tidakHadir, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Terlambat', value: stats.terlambat, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`${card.bg} border rounded-xl p-4 text-center`}>
              <Icon className={`w-5 h-5 ${card.color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${card.color}`}>{stats.totalGuru || stats.hadirHariIni || stats.tidakHadir || stats.terlambat || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="font-semibold text-gray-700 mb-4">Aktivitas Hari Ini</h3>
        <p className="text-gray-500 text-sm">Belum ada aktivitas</p>
      </div>
    </div>
  );
}
