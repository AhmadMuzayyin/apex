'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
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
      <div className="min-h-dvh flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <img src="/favicon.png" alt="APEX" className="w-16 h-16 mx-auto mb-4" />
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-sm app-card animate-fade-in">
        {/* Logo inside card */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => router.push('/')}
            className="hover:opacity-80 transition-opacity"
          >
            <img src="/favicon.png" alt="APEX" className="w-20 h-20" />
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-gray-400 text-xs">
          © 2026 APEX - Academic Performance Excellence
        </p>
      </div>
    </div>
  );
}
