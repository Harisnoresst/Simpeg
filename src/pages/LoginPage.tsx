import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type Props = {
  onNavigate: (page: 'login' | 'register') => void;
};

export default function LoginPage({ onNavigate }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      setError('Email atau password salah.');
      setLoading(false); // Hanya matikan loading jika gagal
    }
   
  }

  return (
    <div className="min-h-screen bg-[#012970] flex items-center justify-center p-4 sm:p-6 overflow-x-hidden">
      
      {/* WRAPPER UTAMA */}
      <div className="w-full max-w-[480px] md:max-w-6xl flex flex-col gap-6 md:gap-8">
        
        {/* HEADER */}
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
          <div className="w-full md:w-[50%] bg-white rounded-md shadow-sm p-6 sm:p-8 md:p-10">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              
              {/* Tampilkan pesan error jika ada */}
              {error && (
                <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm mb-2">Username / Email</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="remember" 
                  className="w-4 h-4 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember" className="text-xs text-gray-500">Remember me</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4455f0] hover:bg-[#3b49d1] text-white py-2.5 rounded text-sm transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Sedang masuk...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-5 space-y-4">
              <button className="text-[11px] text-gray-400 hover:underline">
                Forgot password?
              </button>
              <p className="text-xs text-gray-700">
                Don't have an account?{' '}
                <span 
                  onClick={() => onNavigate('register')}
                  className="text-cyan-400 cursor-pointer hover:underline font-medium"
                >
                  Register here
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Akun Admin <br /> NailaAdmin@Simpeg.com <br /> Simpeg3
              </p>
            </div>
          </div>

          {/* SISI KANAN (GAMBAR) */}
          <div className="hidden md:block w-full md:w-[65%] relative rounded-[45px] overflow-hidden border border-black/10">
            <img 
              src="/login.png" 
              alt="Teacher Illustration" 
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

        </div>

      </div>
    </div>
  );
}