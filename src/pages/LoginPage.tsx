import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError('Email atau password salah. Silakan coba lagi.');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex">
        <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-b from-blue-800 to-blue-900 p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white" />
            <div className="absolute bottom-20 right-5 w-48 h-48 rounded-full bg-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white rounded-full p-2">
                <BookOpen className="w-6 h-6 text-blue-800" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">SIMPEG</p>
                <p className="text-blue-200 text-xs">Absensi Guru</p>
              </div>
            </div>
            <h2 className="text-white text-xl font-bold mt-4 leading-snug">
              SIMPEG ABSENSI GURU
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              Dinas Pendidikan dan Kebudayaan<br />Kabupaten Bandung
            </p>
          </div>

          <div className="relative z-10 flex justify-center">
            <img
              src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=400"
              alt="Teacher illustration"
              className="w-64 h-72 object-cover rounded-xl shadow-lg"
            />
          </div>

          <div className="relative z-10 text-blue-200 text-xs text-center">
            &copy; 2026 Dinas Pendidikan Kab. Bandung
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-blue-800 rounded-full p-2">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-blue-800 font-bold text-lg leading-tight">SIMPEG</p>
              <p className="text-gray-500 text-xs">Absensi Guru</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">Selamat Datang</h1>
          <p className="text-gray-500 text-sm mb-8">Masuk ke akun Anda untuk melanjutkan</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="text-sm text-gray-600">Ingat saya</span>
              </label>
              <button type="button" className="text-sm text-blue-600 hover:underline">
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors duration-200 text-sm shadow-md"
            >
              {loading ? 'Memproses...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Belum punya akun?{' '}
            <span className="text-blue-600 font-medium cursor-pointer hover:underline">
              Hubungi Administrator
            </span>
          </p>

          <div className="mt-8 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-700 font-medium mb-1">Demo Akun:</p>
            <p className="text-xs text-blue-600">Guru: guru@sekolah.sch.id / guru123</p>
            <p className="text-xs text-blue-600">Admin: admin@sekolah.sch.id / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
