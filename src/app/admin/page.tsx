'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Users, Calendar, GraduationCap, Layers, 
  BookOpen, TrendingUp, UserPlus, ChevronRight,
  CalendarCheck, Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, isToday, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DashboardStats {
  totalSiswa: number;
  totalEnrollment: number;
  totalKelompok: number;
  totalTahap: number;
  totalMateri: number;
  enrollmentByKelompok: { name: string; count: number }[];
}

interface TahunAkademik {
  id: string;
  tahun: string;
  status: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
}

interface RecentEnrollment {
  id: string;
  siswa: {
    no_induk: string;
    nama_lengkap: string;
  } | null;
  kelompok: {
    nama_kelompok: string;
  } | null;
  tanggal_daftar: string;
}

interface Jadwal {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  materi_id: string;
  kelompok_id: string;
  tahap_id: string;
  materi?: { nama_materi: string };
  kelompok?: { nama_kelompok: string };
  tahap?: { nama_tahap: string };
}

interface TopSiswa {
  siswa_id: string;
  nama_lengkap: string;
  no_induk: string;
  kelompok_nama: string;
  rata_rata: number;
  overall_rank?: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [selectedTA, setSelectedTA] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalSiswa: 0,
    totalEnrollment: 0,
    totalKelompok: 0,
    totalTahap: 0,
    totalMateri: 0,
    enrollmentByKelompok: [],
  });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [todayJadwal, setTodayJadwal] = useState<Jadwal[]>([]);
  const [overallTop3, setOverallTop3] = useState<TopSiswa[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTA) {
      loadDashboardData();
    }
  }, [selectedTA]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load tahun akademik
      const taRes = await fetch('/api/tahun-akademik');
      const taData = await taRes.json();
      
      if (taData.success) {
        setTahunAkademik(taData.data);
        
        // Set active as default
        const active = taData.data.find((ta: TahunAkademik) => ta.status === 'aktif');
        if (active) {
          setSelectedTA(active.id);
        } else if (taData.data.length > 0) {
          setSelectedTA(taData.data[0].id);
        }
      }
    } catch (error) {
      console.error('Load initial data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load enrollment
      const enrollRes = await fetch(`/api/enrollment?tahun_akademik_id=${selectedTA}`);
      const enrollData = await enrollRes.json();
      
      // Load kelompok
      const kelompokRes = await fetch('/api/kelompok');
      const kelompokData = await kelompokRes.json();
      
      // Load tahap for selected year
      const tahapRes = await fetch(`/api/tahap?tahun_akademik_id=${selectedTA}`);
      const tahapData = await tahapRes.json();
      
      // Load materi
      const materiRes = await fetch('/api/materi');
      const materiData = await materiRes.json();
      
      // Load jadwal for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const jadwalRes = await fetch(`/api/jadwal?tahun_akademik_id=${selectedTA}&tanggal=${today}`);
      const jadwalData = await jadwalRes.json();
      
      // Load ranking
      const rankingRes = await fetch(`/api/ranking?tahun_akademik_id=${selectedTA}`);
      const rankingData = await rankingRes.json();
      
      if (enrollData.success && kelompokData.success) {
        const enrollments = enrollData.data || [];
        const kelompoks = kelompokData.data || [];
        
        // Count enrollment by kelompok
        const enrollByKelompok = kelompoks.map((k: any) => ({
          name: k.nama_kelompok,
          count: enrollments.filter((e: any) => e.kelompok_id === k.id).length,
        }));
        
        // Get unique siswa count
        const uniqueSiswa = new Set(enrollments.map((e: any) => e.siswa_id));
        
        setStats({
          totalSiswa: uniqueSiswa.size,
          totalEnrollment: enrollments.length,
          totalKelompok: kelompoks.length,
          totalTahap: tahapData.success ? tahapData.data.length : 0,
          totalMateri: materiData.success ? materiData.data.length : 0,
          enrollmentByKelompok: enrollByKelompok,
        });
        
        // Recent 5 enrollments
        setRecentEnrollments(enrollments.slice(0, 5));
        
        // Today's schedule
        if (jadwalData.success) {
          setTodayJadwal(jadwalData.data || []);
        }

        // Ranking
        if (rankingData.success) {
          setOverallTop3(rankingData.data.overallTop3 || []);
        }
      }
    } catch (error) {
      console.error('Load dashboard data error:', error);
    }
  };

  const currentTA = tahunAkademik.find(ta => ta.id === selectedTA);

  const quickActions = [
    { icon: UserPlus, label: 'Enrollment', path: '/admin/enrollment', color: 'text-blue-600' },
    { icon: CalendarCheck, label: 'Absensi', path: '/admin/absensi', color: 'text-green-600' },
    { icon: BookOpen, label: 'Nilai', path: '/admin/penilaian/harian', color: 'text-purple-600' },
    { icon: Layers, label: 'Data Master', path: '/admin/data', color: 'text-orange-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="app-topbar">
        <h1>Dashboard Admin</h1>
      </div>

      <div className="app-content p-4 space-y-4">
        {/* Welcome Card */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardDescription>Selamat datang,</CardDescription>
            <CardTitle className="text-2xl">{user?.nama || 'Administrator'}</CardTitle>
          </CardHeader>
        </Card>

        {/* Tahun Akademik Selector */}
        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar size={18} />
              Tahun Akademik
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTA} onValueChange={setSelectedTA}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tahunAkademik.map(ta => (
                  <SelectItem key={ta.id} value={ta.id}>
                    {ta.tahun} {ta.status === 'aktif' && '(Aktif)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentTA && (
              <p className="text-xs text-muted-foreground mt-2">
                {currentTA.tanggal_mulai} s/d {currentTA.tanggal_selesai}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSiswa}</p>
                  <p className="text-xs text-muted-foreground">Siswa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalEnrollment}</p>
                  <p className="text-xs text-muted-foreground">Enrollment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Layers size={20} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalKelompok}</p>
                  <p className="text-xs text-muted-foreground">Kelompok</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                  <GraduationCap size={20} className="text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalTahap}</p>
                  <p className="text-xs text-muted-foreground">Tahap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center">
                  <BookOpen size={20} className="text-pink-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalMateri}</p>
                  <p className="text-xs text-muted-foreground">Materi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="animate-fade-in" style={{ animationDelay: '350ms' }}>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <button
                  key={action.path}
                  className="flex items-center gap-3 p-3 rounded-xl border hover:bg-accent transition-colors"
                  onClick={() => router.push(action.path)}
                >
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                    <action.icon size={20} className={action.color} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{action.label}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 3 Overall Ranking */}
        {overallTop3.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-600" />
                Peringkat Terbaik
              </CardTitle>
              <CardDescription>Top 3 siswa dari seluruh kelompok</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overallTop3.map((siswa, index) => {
                  const colors = [
                    'from-amber-400 to-yellow-500',  // Gold
                    'from-slate-300 to-slate-400',    // Silver
                    'from-orange-400 to-amber-600'    // Bronze
                  ];
                  const badgeColors = [
                    'bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700',
                    'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700',
                    'bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700'
                  ];
                  const medals = ['🥇', '🥈', '🥉'];

                  return (
                    <div 
                      key={siswa.siswa_id} 
                      className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${colors[index]} shadow-lg`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{medals[index]}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{siswa.nama_lengkap}</h3>
                          </div>
                          <p className="text-sm text-white/90">{siswa.no_induk}</p>
                          <p className="text-xs text-white/80">{siswa.kelompok_nama}</p>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-bold ${badgeColors[index]}`}>
                            {siswa.rata_rata.toFixed(1)}
                          </div>
                          <p className="text-xs text-white/80 mt-1">Rata-rata</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enrollment by Kelompok Chart */}
        {stats.enrollmentByKelompok.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-base">Siswa per Kelompok</CardTitle>
              <CardDescription>Distribusi enrollment tahun ini</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.enrollmentByKelompok}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        {todayJadwal.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '450ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock size={18} />
                Jadwal Hari Ini
              </CardTitle>
              <CardDescription>{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: idLocale })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todayJadwal.slice(0, 5).map((jadwal, i) => (
                  <div key={jadwal.id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-xl">
                    <div className="flex flex-col items-center">
                      <p className="text-xs font-medium">{jadwal.jam_mulai}</p>
                      <p className="text-xs text-muted-foreground">{jadwal.jam_selesai}</p>
                    </div>
                    <div className="h-8 w-px bg-border"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{jadwal.materi?.nama_materi || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        {jadwal.kelompok?.nama_kelompok} • {jadwal.tahap?.nama_tahap}
                      </p>
                    </div>
                  </div>
                ))}
                {todayJadwal.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{todayJadwal.length - 5} jadwal lainnya
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Enrollments */}
        {recentEnrollments.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus size={18} />
                Enrollment Terbaru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentEnrollments.map((enrollment, i) => (
                  <div key={enrollment.id} className="flex items-center gap-3 p-2 rounded-xl border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{enrollment.siswa?.nama_lengkap || '-'}</p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.siswa?.no_induk} • {enrollment.kelompok?.nama_kelompok}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {enrollment.tanggal_daftar ? 
                        format(parseISO(enrollment.tanggal_daftar), 'dd MMM', { locale: idLocale }) 
                        : '-'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {stats.totalEnrollment === 0 && (
          <Card className="animate-fade-in">
            <CardContent className="text-center py-8">
              <Users size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">Belum ada enrollment untuk tahun akademik ini</p>
              <button
                className="mt-4 text-sm text-primary hover:underline"
                onClick={() => router.push('/admin/enrollment')}
              >
                Tambah Siswa Sekarang
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
