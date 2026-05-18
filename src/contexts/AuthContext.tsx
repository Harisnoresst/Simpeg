import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import api from '../lib/axios'; // Pastikan path ini mengarah ke file axios.ts yang baru Anda buat

// Tipe User dari Laravel
export type User = {
  id: string | number;
  email: string;
};

// Tipe Profile disesuaikan dengan kolom di tabel users Laravel Anda
export type Profile = {
  id: string | number;
  name: string; // Di Laravel kita menggunakan 'name'
  full_name?: string; // Menyimpan untuk backward compatibility jika diperlukan
  nip?: string | null;
  role: string;
  subject?: string | null;
  school_id?: string | number | null;
  phone?: string | null;
  address?: string | null;
  avatar_url?: string | null;
};

type AuthContextType = {
  user: User | null;
  session: any;
  profile: Profile | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;

  signUp: (
    email: string,
    password: string,
    data: Partial<Profile>
  ) => Promise<{ error: Error | null }>;

  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD USER DARI LARAVEL API
  // =========================
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth_token');

      if (token) {
        try {
          // Minta data user ke Laravel
          const { data } = await api.get('/me');
          
          setUser({ id: data.id, email: data.email });
          setProfile(data); // Laravel mengembalikan semua data termasuk nip, role, dll
          setSession({ access_token: token });
        } catch (error) {
          console.error('Token tidak valid / expired', error);
          localStorage.removeItem('auth_token');
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      }

      setLoading(false);
    };

    loadUser();
  }, []);

  // =========================
  // REFRESH PROFILE
  // =========================
  async function refreshProfile() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const { data } = await api.get('/me');
        setProfile(data);
      } catch (error) {
        console.error('Gagal memuat ulang profil', error);
      }
    }
  }

  // =========================
  // SIGN IN
  // =========================
  async function signIn(
    email: string,
    password: string
  ) {
    try {
      // Nembak API Laravel
      const { data } = await api.post('/login', { email, password });

      // SAVE TOKEN
      localStorage.setItem('auth_token', data.access_token);

      // SET STATE
      setUser({ id: data.user.id, email: data.user.email });
      setProfile(data.user);
      setSession({ access_token: data.access_token });

      return { error: null };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Login gagal. Periksa email dan password.';
      return {
        error: new Error(errMsg),
      };
    }
  }

  // =========================
  // SIGN UP
  // =========================
  async function signUp(
    email: string,
    password: string,
    data: Partial<Profile>
  ) {
    try {
      // Siapkan data sesuai kebutuhan API Laravel (AuthController@register)
      const payload = {
        email: email,
        password: password,
        password_confirmation: password, // Laravel butuh ini untuk validasi `confirmed`
        name: data.full_name || data.name || 'User Baru', // Map full_name ke name
        nip: data.nip || '',
        role: data.role || 'guru',
        subject: data.subject || '',
        phone: data.phone || '',
      };

      // Nembak API Laravel
      const { data: responseData } = await api.post('/register', payload);

      // SAVE TOKEN (Auto login setelah register)
      localStorage.setItem('auth_token', responseData.access_token);

      // SET STATE
      setUser({ id: responseData.data.id, email: responseData.data.email });
      setProfile(responseData.data);
      setSession({ access_token: responseData.access_token });

      return {
        error: null,
      };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Registrasi gagal. Email mungkin sudah terdaftar.';
      return {
        error: new Error(errMsg),
      };
    }
  }

  // =========================
  // SIGN OUT
  // =========================
  async function signOut() {
    try {
      // Beritahu Laravel untuk menghapus token ini dari database
      await api.post('/logout');
    } catch (error) {
      console.error('Gagal logout di server', error);
    } finally {
      // Hapus data lokal (apapun yang terjadi di server)
      localStorage.removeItem('auth_token');
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {/* Jangan render children sebelum loading selesai agar halaman yang butuh Auth tidak error */}
      {!loading && children}
    </AuthContext.Provider>
  );
}

// =========================
// USE AUTH
// =========================
export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
}