'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, Trophy, LogIn, ArrowRight } from 'lucide-react';

interface TopSiswa {
  siswa_id: string;
  nama_lengkap: string;
  no_induk: string;
  kelompok_nama: string;
  rata_rata: number;
  overall_rank?: number;
}

interface TahunAkademik {
  id: string;
  tahun: string;
  status: string;
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [overallTop3, setOverallTop3] = useState<TopSiswa[]>([]);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/student');
      }
    }
  }, [user, loading, router]);

  // Load ranking data
  useEffect(() => {
    loadRankingData();
  }, []);

  const loadRankingData = async () => {
    try {
      // Get active tahun akademik
      const taRes = await fetch('/api/tahun-akademik?status=aktif');
      const taData = await taRes.json();
      
      if (taData.success && taData.data && taData.data.length > 0) {
        const activeTahun = taData.data[0];
        setTahunAkademik(activeTahun);

        // Get ranking
        const rankingRes = await fetch(`/api/ranking?tahun_akademik_id=${activeTahun.id}`);
        const rankingData = await rankingRes.json();

        if (rankingData.success) {
          setOverallTop3(rankingData.data.overallTop3 || []);
        }
      }
    } catch (error) {
      console.error('Load ranking error:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-24 h-24 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <GraduationCap size={48} className="text-white" />
          </div>
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium text-lg">Memuat APEX...</p>
        </div>
      </div>
    );
  }

  // Show landing page with ranking (for non-authenticated users)
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-md">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">APEX</h1>
                <p className="text-xs text-gray-500">Academic Performance Excellence</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/login')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-all shadow-md hover:shadow-lg"
            >
              <LogIn size={18} />
              <span className="font-medium">Masuk</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
              <Trophy size={16} className="text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">
                {tahunAkademik ? `Tahun Akademik ${tahunAkademik.tahun}` : 'Peringkat Siswa Terbaik'}
              </span>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🏆 Top 3 Siswa Terbaik
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Selamat kepada siswa-siswa berprestasi yang telah menunjukkan dedikasi dan kerja keras luar biasa
          </p>
        </div>

        {/* Ranking Cards */}
        {loadingData ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data ranking...</p>
          </div>
        ) : overallTop3.length > 0 ? (
          <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
            {overallTop3.map((siswa, index) => {
              const colors = [
                'from-amber-400 to-yellow-500',
                'from-slate-300 to-slate-400',
                'from-orange-400 to-amber-600'
              ];
              const badgeColors = [
                'bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-800',
                'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-800',
                'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-800'
              ];
              const medals = ['🥇', '🥈', '🥉'];
              const scales = ['scale-105', 'scale-100', 'scale-95'];

              return (
                <div 
                  key={siswa.siswa_id}
                  className={`transform ${scales[index]} transition-all duration-300 hover:scale-110 animate-fade-in`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className={`relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br ${colors[index]} shadow-2xl`}>
                    <div className="flex items-center gap-4 md:gap-6">
                      {/* Medal */}
                      <div className="text-6xl md:text-7xl animate-bounce" style={{ animationDuration: '2s' }}>
                        {medals[index]}
                      </div>
                      
                      {/* Student Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-white/90 text-sm font-bold">RANK #{index + 1}</span>
                        </div>
                        <h3 className="font-bold text-white text-2xl md:text-3xl mb-2">{siswa.nama_lengkap}</h3>
                        <div className="flex flex-wrap gap-2 text-white/90">
                          <span className="text-sm md:text-base font-medium">{siswa.no_induk}</span>
                          <span className="text-sm md:text-base">•</span>
                          <span className="text-sm md:text-base font-medium">{siswa.kelompok_nama}</span>
                        </div>
                      </div>
                      
                      {/* Score Badge */}
                      <div className="text-center">
                        <div className={`px-4 md:px-6 py-2 md:py-3 rounded-2xl text-lg md:text-xl font-bold ${badgeColors[index]} shadow-lg`}>
                          {siswa.rata_rata.toFixed(1)}
                        </div>
                        <p className="text-xs md:text-sm text-white/80 mt-2 font-medium">Rata-rata</p>
                      </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl max-w-2xl mx-auto shadow-md border border-gray-200">
            <Trophy size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">Belum ada data ranking tersedia</p>
            <p className="text-gray-500 text-sm mt-2">Data akan muncul setelah ada nilai siswa</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12 md:mt-16 animate-fade-in" style={{ animationDelay: '600ms' }}>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            <span>Masuk ke APEX</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2026 APEX - Academic Performance Excellence. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
