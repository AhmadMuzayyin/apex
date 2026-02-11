'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useStore, Siswa, Kelompok, Tahap, Materi, NilaiHarian as NH, NilaiUlangan as NU, Lencana, hitungIPK, hitungIPT, hitungIP, getBobot } from '@/lib/store';
import { TrendingUp, Award, BookOpen } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { items: siswaList } = useStore<Siswa>('siswa');
  const { items: kelompokList } = useStore<Kelompok>('kelompok');
  const { items: tahapList } = useStore<Tahap>('tahap');
  const { items: materiList } = useStore<Materi>('materi');
  const { items: nhAll } = useStore<NH>('nilaiHarian');
  const { items: nuAll } = useStore<NU>('nilaiUlangan');
  const { items: lencanaList } = useStore<Lencana>('lencana');

  const siswa = siswaList.find(s => s.id === user?.siswaId);
  const kelompok = kelompokList.find(k => k.id === siswa?.kelompokId);

  if (!siswa) return (
    <div>
      <div className="app-topbar"><h1>Dashboard</h1></div>
      <div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data siswa tidak ditemukan</p></div>
    </div>
  );

  const ipkResult = hitungIPK(siswa.id, tahapList, materiList, nhAll, nuAll);
  const lastTahap = tahapList.sort((a, b) => b.urutan - a.urutan)[0];
  const lastIPT = lastTahap ? hitungIPT(siswa.id, lastTahap.id, materiList, nhAll, nuAll) : null;

  // Count badges
  let badgeCount = 0;
  tahapList.forEach(t => {
    materiList.forEach(m => {
      const nh = nhAll.filter(n => n.siswaId === siswa.id && n.tahapId === t.id && n.materiId === m.id);
      const nu = nuAll.find(n => n.siswaId === siswa.id && n.tahapId === t.id && n.materiId === m.id);
      const ip = hitungIP(nh, nu);
      if (ip) badgeCount += lencanaList.filter(l => ip.total >= l.syaratNilaiMin).length;
    });
  });

  return (
    <div>
      <div className="app-topbar">
        <h1>Dashboard</h1>
      </div>
      <div className="app-content p-4 space-y-4">
        <div className="app-card animate-fade-in">
          <p className="text-sm text-muted-foreground">Selamat datang,</p>
          <h2 className="text-xl font-bold text-foreground">{siswa.nama}</h2>
          <p className="text-sm text-muted-foreground">{siswa.nomorInduk} • {kelompok?.nama} • Angkatan {siswa.angkatan}</p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="stat-card animate-fade-in" style={{ animationDelay: '50ms' }}>
            <TrendingUp size={24} className="text-primary mb-1" />
            <span className="text-xl font-bold text-foreground">{ipkResult ? ipkResult.ipk.toFixed(2) : '-'}</span>
            <span className="text-[10px] text-muted-foreground">IPK</span>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '100ms' }}>
            <BookOpen size={24} className="text-info mb-1" />
            <span className="text-xl font-bold text-foreground">{lastIPT ? lastIPT.ipt.toFixed(2) : '-'}</span>
            <span className="text-[10px] text-muted-foreground">IPT Terakhir</span>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '150ms' }}>
            <Award size={24} className="text-secondary mb-1" />
            <span className="text-xl font-bold text-foreground">{badgeCount}</span>
            <span className="text-[10px] text-muted-foreground">Lencana</span>
          </div>
        </div>

        {ipkResult && (
          <div className="app-card bg-accent/50 border-primary/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-center">
              <p className="text-sm text-accent-foreground">Indeks Prestasi Kumulatif</p>
              <p className="text-4xl font-extrabold text-primary mt-1">{ipkResult.ipk.toFixed(2)}</p>
              <p className="text-sm text-accent-foreground mt-1">Predikat: <span className="font-bold">{getBobot(ipkResult.ipk * 25).predikat}</span></p>
              <p className="text-xs text-muted-foreground mt-1">{ipkResult.totalTahap} tahap selesai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
