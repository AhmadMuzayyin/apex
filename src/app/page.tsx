'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/student');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="text-center">
        {/* Logo Video */}
        <div className="w-32 h-32 mx-auto mb-6">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-contain"
          >
            <source src="/logo.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white font-medium text-lg">Memuat APEX...</p>
      </div>
    </div>
  );
}
