import { useEffect, useState } from 'react';
import { supabase, School } from '../../lib/supabase';

export default function AdminSekolahPage() {
  const [school, setSchool] = useState<School | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<School>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    const { data } = await supabase.from('schools').select('*').limit(1).maybeSingle();
    if (data) {
      setSchool(data);
      setFormData(data); // Siapkan data untuk form edit
    }
  };

  const handleSave = async () => {
    if (!school?.id) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('schools')
        .update({
          name: formData.name,
          address: formData.address,
          latitude: Number(formData.latitude),
          longitude: Number(formData.longitude),
          allowed_radius_meters: Number(formData.allowed_radius_meters),
        })
        .eq('id', school.id);

      if (!error) {
        setSchool({ ...school, ...formData } as School);
        setIsEditing(false);
      } else {
        alert('Gagal menyimpan perubahan.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(school || {});
    setIsEditing(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Pengaturan Sekolah</h2>
        
        {/* Tombol Aksi Simpan / Edit (Menyesuaikan letak agar UI tidak rusak) */}
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Edit Profil
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCancel} 
              className="text-sm font-medium text-gray-500 hover:underline"
            >
              Batal
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header Biru */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 p-6 text-white">
          <p className="font-bold text-lg">
            {isEditing ? (
               <input 
                 value={formData.name || ''} 
                 onChange={(e) => setFormData({...formData, name: e.target.value})}
                 className="bg-transparent border-b border-blue-400 outline-none w-full placeholder-blue-300"
                 placeholder="Nama Sekolah"
               />
            ) : (
               school?.name || 'Sekolah'
            )}
          </p>
          <p className="text-blue-200 text-sm mt-1">
            {isEditing ? (
               <input 
                 value={formData.address || ''} 
                 onChange={(e) => setFormData({...formData, address: e.target.value})}
                 className="bg-transparent border-b border-blue-400 outline-none w-full placeholder-blue-300"
                 placeholder="Alamat Sekolah"
               />
            ) : (
               school?.address || '-'
            )}
          </p>
        </div>

        {/* List Detail */}
        <div className="p-6 space-y-4">
          {[
            { label: 'Nama Sekolah', key: 'name', type: 'text' },
            { label: 'Alamat', key: 'address', type: 'text' },
            { label: 'Latitude', key: 'latitude', type: 'number' },
            { label: 'Longitude', key: 'longitude', type: 'number' },
            { label: 'Radius Absensi (meter)', key: 'allowed_radius_meters', type: 'number' },
          ].map(item => (
            <div key={item.label} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
              <span className="text-sm text-gray-500">{item.label}</span>
              
              {isEditing ? (
                <input
                  type={item.type}
                  step={item.type === 'number' ? 'any' : undefined} // Agar latitude & longitude bisa pakai desimal
                  value={formData[item.key as keyof School] as string | number || ''}
                  onChange={(e) => setFormData({ ...formData, [item.key]: e.target.value })}
                  className="text-sm font-medium text-gray-800 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-right w-1/2 outline-none focus:border-blue-500 transition-colors"
                />
              ) : (
                <span className="text-sm font-medium text-gray-800">
                  {school?.[item.key as keyof School] || '-'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}