'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Award, BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hitungIPK, hitungIPT, hitungIP, getBobot } from '@/lib/calculations';
import type { Siswa, Kelompok, Tahap, Materi, NilaiHarian, NilaiUlangan, Lencana, TahunAkademik, JamTambahan } from '@/types/firestore';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [kelompok, setKelompok] = useState<Kelompok | null>(null);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [nilaiHarian, setNilaiHarian] = useState<NilaiHarian[]>([]);
  const [nilaiUlangan, setNilaiUlangan] = useState<NilaiUlangan[]>([]);
  const [lencanas, setLencanas] = useState<Lencana[]>([]);
  const [jamTambahan, setJamTambahan] = useState<JamTambahan[]>([]);

  useEffect(() => {
    const loadTahunAkademik = async () => {
      try {
        const taRes = await fetch('/api/tahun-akademik');
        const taData = await taRes.json();
        if (taData.success) {
          const active = taData.data.find((ta: TahunAkademik) => ta.status === 'aktif');
          if (active) {
            setSelectedTahunAkademik(active.id);
          }
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Gagal memuat tahun akademik',
          variant: 'destructive',
        });
      }
    };

    loadTahunAkademik();
  }, [toast]);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.siswaId || !selectedTahunAkademik) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/siswa/${user.siswaId}?tahun_akademik_id=${selectedTahunAkademik}`);
        const payload = await res.json();
        if (!payload.success) {
          throw new Error(payload.message || 'Gagal memuat data siswa');
        }

        const data = payload.data;
        setSiswa(data.siswa || null);
        setKelompok(data.kelompok || null);
        setTahaps(data.tahaps || []);
        setMateris(data.materis || []);
        setNilaiHarian(data.nilai_harian || []);
        setNilaiUlangan(data.nilai_ulangan || []);
        setLencanas(data.lencanas || []);
        setJamTambahan(data.jam_tambahan || []);
      } catch (error) {
        console.error('Error loading student dashboard:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data dashboard',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.siswaId, selectedTahunAkademik, toast]);

  if (loading) {
    return (
      <div>
        <div className="app-topbar"><h1>Dashboard</h1></div>
        <div className="app-content p-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!siswa) {
    return (
      <div>
        <div className="app-topbar"><h1>Dashboard</h1></div>
        <div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data siswa tidak ditemukan</p></div>
      </div>
    );
  }

  const ipkResult = hitungIPK(siswa.id, tahaps, materis, nilaiHarian, nilaiUlangan, jamTambahan);
  const lastTahap = [...tahaps].sort((a, b) => b.urutan - a.urutan)[0];
  const lastIPT = lastTahap ? hitungIPT(siswa.id, lastTahap.id, materis, nilaiHarian, nilaiUlangan, jamTambahan) : null;

  let badgeCount = 0;
  tahaps.forEach(t => {
    materis.forEach(m => {
      const nh = nilaiHarian.filter(n => n.siswa_id === siswa.id && n.tahap_id === t.id && n.materi_id === m.id);
      const nu = nilaiUlangan.find(n => n.siswa_id === siswa.id && n.tahap_id === t.id && n.materi_id === m.id);
      const jt = jamTambahan.find(j => j.siswa_id === siswa.id && j.tahap_id === t.id && j.materi_id === m.id && j.status === 'selesai' && j.nilai_tambahan !== undefined);
      const ip = hitungIP(nh, nu, jt?.nilai_tambahan);
      if (ip) badgeCount += lencanas.filter(l => ip.total >= l.nilai_min).length;
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
          <h2 className="text-xl font-bold text-foreground">{siswa.nama_lengkap}</h2>
          <p className="text-sm text-muted-foreground">{siswa.no_induk} • {kelompok?.nama_kelompok || '-'} • Angkatan {siswa.angkatan}</p>
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
              <p className="text-xs text-muted-foreground mt-1">{ipkResult ? tahaps.length : 0} tahap selesai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
