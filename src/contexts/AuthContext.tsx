import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authService, type AuthUser } from '../services/authService';

interface User {
  id: string;
  code: string;
  role: 'admin' | 'siswa';
  nama: string;
  siswaId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen ke perubahan auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get user data dari localStorage atau fetch dari Firestore
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } else {
        setUser(null);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (code: string, password: string): Promise<void> => {
    try {
      const userData = await authService.login(code, password);
      const userInfo: User = {
        id: userData.id,
        code: userData.code,
        role: userData.role,
        nama: userData.nama,
        siswaId: userData.siswa_id,
      };
      setUser(userInfo);
      localStorage.setItem('currentUser', JSON.stringify(userInfo));
    } catch (error: any) {
      throw new Error(error.message || 'Login gagal');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem('currentUser');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
