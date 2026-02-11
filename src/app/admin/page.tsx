'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStore, Siswa, Kelompok, Materi, Tahap, JamTambahan as JT, JadwalRutin, JadwalKhusus, HariLibur } from '@/lib/store';
import { getTodayJadwal } from '@/lib/jadwal-utils';
import { Users, Layers, BookOpen, GraduationCap, Calendar, Clock, AlertCircle, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { items: siswa } = useStore<Siswa>('siswa');
  const { items: kelompok } = useStore<Kelompok>('kelompok');
  const { items: materi } = useStore<Materi>('materi');
  const { items: tahap } = useStore<Tahap>('tahap');
  const { items: jtList } = useStore<JT>('jamTambahan');
  const { items: jadwalRutin } = useStore<JadwalRutin>('jadwalRutin');
  const { items: jadwalKhusus } = useStore<JadwalKhusus>('jadwalKhusus');
  const { items: hariLibur } = useStore<HariLibur>('hariLibur');

  const todayJadwal = getTodayJadwal(jadwalRutin, jadwalKhusus, hariLibur);
  const pendingJT = jtList.filter(jt => jt.status === 'pending').length;

  const stats = [
    { icon: Users, label: 'Siswa', value: siswa.length, color: 'text-primary bg-accent' },
    { icon: Layers, label: 'Kelompok', value: kelompok.length, color: 'text-secondary bg-secondary/10' },
    { icon: BookOpen, label: 'Materi', value: materi.length, color: 'text-success bg-success/10' },
    { icon: GraduationCap, label: 'Tahap', value: tahap.length, color: 'text-info bg-info/10' },
  ];

  const getTahapName = (id: string) => tahap.find(t => t.id === id)?.nama || '-';
  const getMateriName = (id: string) => materi.find(m => m.id === id)?.nama || '-';
  const getKelompokName = (id: string) => kelompok.find(k => k.id === id)?.nama || '-';

  return (
    <div>
      <div className="app-topbar">
        <h1>Dashboard Admin</h1>
      </div>
      <div className="app-content p-4 space-y-4">
        <div className="app-card animate-fade-in">
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h2 className="text-xl font-bold text-foreground">{user?.code === 'admin' ? 'Administrator' : user?.code}</h2>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1"
            onClick={() => router.push('/admin/absensi')}
          >
            <UserCheck size={20} className="text-primary" />
            <span className="text-xs">Absensi</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 relative"
            onClick={() => router.push('/admin/jam-tambahan')}
          >
            <Clock size={20} className="text-warning" />
            <span className="text-xs">Jam Tambahan</span>
            {pendingJT > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {pendingJT}
              </span>
            )}
          </Button>
        </div>

        {/* Today's Schedule */}
        {todayJadwal.length > 0 && (
          <div className="app-card animate-fade-in">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-primary" />
              <h3 className="font-semibold text-foreground">Jadwal Hari Ini</h3>
            </div>
            <div className="space-y-2">
              {todayJadwal.slice(0, 3).map(j => (
                <div key={j.id} className="flex items-center gap-3 p-2 bg-accent/50 rounded-xl">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={12} /> {'jamMulai' in j ? j.jamMulai : ''}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-foreground">{getMateriName(j.materiId)}</div>
                    <div className="text-xs text-muted-foreground">{getTahapName(j.tahapId)} • {getKelompokName(j.kelompokId)}</div>
                  </div>
                </div>
              ))}
              {todayJadwal.length > 3 && (
                <p className="text-xs text-muted-foreground text-center">+{todayJadwal.length - 3} jadwal lainnya</p>
              )}
            </div>
          </div>
        )}

        {/* Pending Jam Tambahan Alert */}
        {pendingJT > 0 && (
          <div className="app-card bg-warning/10 border-warning/20 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-warning" />
              <div>
                <div className="font-semibold text-foreground">{pendingJT} Jam Tambahan Pending</div>
                <div className="text-xs text-muted-foreground">Siswa dengan nilai di bawah KKM</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <div key={s.label} className="stat-card animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 ${s.color}`}>
                <s.icon size={24} />
              </div>
              <span className="text-2xl font-bold text-foreground">{s.value}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="app-card">
          <h3 className="font-semibold mb-2 text-foreground">Info Akun</h3>
          <p className="text-sm text-muted-foreground">Kode: <span className="font-medium text-foreground">{user?.code}</span></p>
          <p className="text-sm text-muted-foreground">Role: <span className="font-medium text-foreground capitalize">{user?.role}</span></p>
        </div>
      </div>
    </div>
  );
}
