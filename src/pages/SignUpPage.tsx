import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext'; // <-- Menggunakan AuthContext untuk memanggil Laravel

type Props = {
  onNavigate: (page: 'login' | 'register') => void;
};

export default function SignUpPage({ onNavigate }: Props) {
  // Ambil fungsi signUp dari AuthContext
  const { signUp } = useAuth();

  // State Form
  const [role, setRole] = useState('guru');
  const [nip, setNip] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // State Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Password dan Konfirmasi Password tidak cocok.');
    }
    if (!agreeTerms) {
      return setError('Anda harus menyetujui Syarat dan Ketentuan.');
    }
    if (password.length < 6) {
      return setError('Password minimal harus 6 karakter.');
    }

    setLoading(true);

    // Panggil fungsi signUp dari Laravel via AuthContext
    const { error: signUpError } = await signUp(email, password, {
      full_name: fullName,
      nip: nip,
      role: role // Role (admin/guru) dikirim ke Laravel di sini
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      onNavigate('login'); 
    }
  }

  return (
    <div className="min-h-screen bg-[#012970] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden font-sans">
      
      {/* WRAPPER UTAMA (Sama persis dengan Login) */}
      <div className="w-full max-w-[480px] md:max-w-6xl flex flex-col gap-6 md:gap-8">
        
        {/* HEADER LOGO */}
        <div className="flex items-center gap-3 sm:gap-4 md:ml-2">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain shrink-0"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
              SIMPEG ABSENSI GURU
            </h1>
            <p className="text-xs sm:text-sm text-white font-medium leading-tight mt-1 sm:mt-0">
              Dinas Pendidikan dan Kebudayaan<br />
              Kabupaten Bandung
            </p>
          </div>
        </div>

        {/* CONTAINER FORM & GAMBAR */}
        <div className="flex flex-col md:flex-row items-stretch gap-8 w-full">
          
          {/* SISI KIRI (FORM) */}
          <div className="w-full md:w-[50%] max-w-[500px] flex flex-col">
            <div className="bg-white rounded-md shadow-sm p-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign Up</h2>
              <p className="text-[13px] text-gray-500 mb-6 font-medium">Buat akun baru untuk mengakses SIMPEG</p>

              {error && (
                <div className="bg-red-50 text-red-500 text-[13px] p-3 rounded border border-red-200 mb-4 font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-1">
                
                <div>
                  <label className="block text-gray-700 text-[13px] mb-1.5">Pilih peran</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[13px] appearance-none bg-white"
                  >
                    <option value="guru">Guru / Staf</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 text-[13px] mb-1.5">
                    NIP (untuk guru) / Username (Untuk Admin) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[13px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-[13px] mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[13px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-[13px] mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[13px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-[13px] mb-1.5">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[13px]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-[13px] mb-1.5">
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-[13px]"
                    required
                  />
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-600 cursor-pointer leading-tight">
                    Saya menyetujui <span className="text-[#4455f0] hover:underline">Syarat dan Ketentuan</span> serta <span className="text-[#4455f0] hover:underline">Kebijakan Privasi</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4455f0] hover:bg-blue-700 text-white py-2.5 rounded text-[13px] font-bold transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? 'Memproses...' : 'Sign up'}
                </button>
              </form>
            </div>

            {/* LINK KE LOGIN */}
            <p className="text-[12px] text-gray-300 font-medium mt-4 ml-1">
              Sudah punya akun?{' '}
              <span 
                onClick={() => onNavigate('login')}
                className="text-[#3b82f6] cursor-pointer hover:underline hover:text-blue-400 font-semibold"
              >
                Masuk sekarang
              </span>
            </p>
          </div>

          {/* gambar kanan */}
          <div className="hidden md:block w-full md:w-[55%] h-[550px] relative rounded-[40px] overflow-hidden">
            <img 
              src="/login.png" 
              alt="Ilustrasi Guru" 
              className="absolute inset-0 min-w-10 h-full object-cover"
              style={{ objectPosition: 'center 20%' }}
            />
          </div>

        </div>

      </div>
    </div>
  );
}