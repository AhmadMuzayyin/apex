'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, login } = useAuth();
  const router = useRouter();

  // Redirect jika sudah login
  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === 'admin' ? '/admin' : '/student');
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code || !password) {
      setError('Semua field harus diisi');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(code, password);
      // Navigate akan otomatis lewat useEffect di atas setelah user di-set
    } catch (err: any) {
      setError(err.message || 'Kode atau password salah');
    } finally {
      setIsLoading(false);
    }
  };

  // Tampilkan loading saat checking auth state
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-primary">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-foreground border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-foreground/70">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-primary">
      <div className="text-center mb-8 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-primary-foreground/20 flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={40} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-primary-foreground">Sistem Penilaian</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Masuk untuk melanjutkan</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm app-card space-y-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Kode / No Induk</Label>
          <Input 
            className="rounded-xl h-12" 
            placeholder="Masukkan kode" 
            value={code} 
            onChange={e => setCode(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input
              className="rounded-xl h-12 pr-12"
              type={showPw ? 'text' : 'password'}
              placeholder="Masukkan password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground disabled:opacity-50" 
              onClick={() => setShowPw(!showPw)}
              disabled={isLoading}
            >
              {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-destructive font-medium">{error}</p>}
        <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Gunakan no_induk/code dan password untuk login
        </p>
      </form>
    </div>
  );
}
