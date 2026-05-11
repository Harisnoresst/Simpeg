import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

type DemoUser = {
  id: string;
  email: string;
};

export type Profile = {
  id: string;
  full_name: string;
  nip?: string | null;
  role: string;
  subject?: string;
  school_id?: string | null;
  phone?: string;
};

type AuthContextType = {
  user: DemoUser | null;
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

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<DemoUser | null>(null);

  const [session, setSession] = useState<any>(null);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] = useState(true);

  // =========================
  // LOAD DEMO USER
  // =========================
  useEffect(() => {
    const savedUser = localStorage.getItem('demo_user');
    const savedProfile =
      localStorage.getItem('demo_profile');

    if (savedUser && savedProfile) {
      setUser(JSON.parse(savedUser));
      setProfile(JSON.parse(savedProfile));

      setSession({
        access_token: 'demo-token',
      });
    }

    setLoading(false);
  }, []);

  // =========================
  // REFRESH PROFILE
  // =========================
  async function refreshProfile() {
    const savedProfile =
      localStorage.getItem('demo_profile');

    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
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
      // DEMO LOGIN
      const demoUser: DemoUser = {
        id: 'demo-user-id',
        email,
      };

      const demoProfile: Profile = {
        id: 'demo-user-id',
        full_name: 'Demo User',
        nip: '123456789',
        role: email.includes('admin')
          ? 'admin'
          : 'guru',
        subject: 'Informatika',
        school_id: null,
        phone: '08123456789',
      };

      // SAVE LOCAL
      localStorage.setItem(
        'demo_user',
        JSON.stringify(demoUser)
      );

      localStorage.setItem(
        'demo_profile',
        JSON.stringify(demoProfile)
      );

      // SET STATE
      setUser(demoUser);
      setProfile(demoProfile);

      setSession({
        access_token: 'demo-token',
      });

      return { error: null };
    } catch (err: any) {
      return {
        error: err,
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
      const demoUser: DemoUser = {
        id: crypto.randomUUID(),
        email,
      };

      const demoProfile: Profile = {
        id: demoUser.id,
        full_name: data.full_name || 'User Baru',
        nip: data.nip || '',
        role: data.role || 'guru',
        subject: data.subject || '',
        school_id: data.school_id || null,
        phone: data.phone || '',
      };

      // SAVE LOCAL
      localStorage.setItem(
        'demo_user',
        JSON.stringify(demoUser)
      );

      localStorage.setItem(
        'demo_profile',
        JSON.stringify(demoProfile)
      );

      // SET STATE
      setUser(demoUser);
      setProfile(demoProfile);

      setSession({
        access_token: 'demo-token',
      });

      return {
        error: null,
      };
    } catch (err: any) {
      return {
        error: err,
      };
    }
  }

  // =========================
  // SIGN OUT
  // =========================
  async function signOut() {
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_profile');

    setUser(null);
    setProfile(null);
    setSession(null);
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
      {children}
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