'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hitungIP, hitungIPT, hitungIPK, getBobot } from '@/lib/calculations';
import type { Siswa, Tahap, Materi, NilaiHarian, NilaiUlangan, Lencana, TahunAkademik, JamTambahan } from '@/types/firestore';

export default function StudentPrestasi() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [siswa, setSiswa] = useState<Siswa | null>(null);
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
        setTahaps(data.tahaps || []);
        setMateris(data.materis || []);
        setNilaiHarian(data.nilai_harian || []);
        setNilaiUlangan(data.nilai_ulangan || []);
        setLencanas(data.lencanas || []);
        setJamTambahan(data.jam_tambahan || []);
      } catch (error) {
        console.error('Error loading prestasi siswa:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat prestasi siswa',
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
        <div className="app-topbar"><h1>Prestasi</h1></div>
        <div className="app-content p-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!siswa) {
    return (
      <div>
        <div className="app-topbar"><h1>Prestasi</h1></div>
        <div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data tidak ditemukan</p></div>
      </div>
    );
  }

  const ipkResult = hitungIPK(siswa.id, tahaps, materis, nilaiHarian, nilaiUlangan, jamTambahan);

  const badges: { lencana: Lencana; tahap: string; materi: string }[] = [];
  tahaps.forEach(t => {
    materis.forEach(m => {
      const nh = nilaiHarian.filter(n => n.siswa_id === siswa.id && n.tahap_id === t.id && n.materi_id === m.id);
      const nu = nilaiUlangan.find(n => n.siswa_id === siswa.id && n.tahap_id === t.id && n.materi_id === m.id);
      const jt = jamTambahan.find(j => j.siswa_id === siswa.id && j.tahap_id === t.id && j.materi_id === m.id && j.status === 'selesai' && j.nilai_tambahan !== undefined);
      const ip = hitungIP(nh, nu, jt?.nilai_tambahan);
      if (ip) {
        lencanas.filter(l => ip.total >= l.nilai_min).forEach(l => {
          badges.push({ lencana: l, tahap: t.nama_tahap, materi: m.nama_materi });
        });
      }
    });
  });

  return (
    <div>
      <div className="app-topbar"><h1>Prestasi</h1></div>
      <div className="app-content p-4 space-y-4">
        {ipkResult && (
          <div className="app-card text-center animate-fade-in">
            <p className="text-sm text-muted-foreground">IPK Keseluruhan</p>
            <p className="text-5xl font-extrabold text-primary mt-2">{ipkResult.ipk.toFixed(2)}</p>
            <p className="text-lg font-semibold text-foreground mt-1">Predikat {getBobot(ipkResult.ipk * 25).predikat}</p>
            <p className="text-sm text-muted-foreground">{tahaps.length} tahap selesai</p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">IPT per Tahap</h3>
          {[...tahaps].sort((a, b) => a.urutan - b.urutan).map(t => {
            const iptResult = hitungIPT(siswa.id, t.id, materis, nilaiHarian, nilaiUlangan, jamTambahan);
            return (
              <div key={t.id} className="app-card flex justify-between items-center">
                <span className="font-medium text-foreground">{t.nama_tahap}</span>
                <span className={`font-bold ${iptResult ? 'text-primary' : 'text-muted-foreground'}`}>{iptResult ? iptResult.ipt.toFixed(2) : '-'}</span>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">🏆 Lencana ({badges.length})</h3>
          {badges.length === 0 && <p className="text-sm text-muted-foreground">Belum ada lencana</p>}
          {badges.map((b, i) => (
            <div key={i} className="app-card flex items-center gap-3">
              {b.lencana.icon_url ? (
                <img src={b.lencana.icon_url} alt={b.lencana.nama_lencana} className="h-8 w-8 object-contain" />
              ) : (
                <span className="text-2xl">🏆</span>
              )}
              <div>
                <div className="font-semibold text-foreground">{b.lencana.nama_lencana}</div>
                <div className="text-xs text-muted-foreground">{b.tahap} • {b.materi}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
