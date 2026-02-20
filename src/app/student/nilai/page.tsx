'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { hitungIP, hitungIPT } from '@/lib/calculations';
import type { Siswa, Tahap, Materi, NilaiHarian, NilaiUlangan, TahunAkademik, JamTambahan, Jadwal, SiswaEnrollment } from '@/types/firestore';

export default function StudentNilai() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [nilaiHarian, setNilaiHarian] = useState<NilaiHarian[]>([]);
  const [nilaiUlangan, setNilaiUlangan] = useState<NilaiUlangan[]>([]);
  const [jamTambahan, setJamTambahan] = useState<JamTambahan[]>([]);
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [enrollment, setEnrollment] = useState<SiswaEnrollment | null>(null);
  const [selTahap, setSelTahap] = useState<string | null>(null);

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
        setJamTambahan(data.jam_tambahan || []);
        setJadwals(data.jadwals || []);
        setEnrollment(data.enrollment || null);
      } catch (error) {
        console.error('Error loading nilai siswa:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat nilai siswa',
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
        <div className="app-topbar"><h1>Nilai Saya</h1></div>
        <div className="app-content p-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!siswa) {
    return (
      <div>
        <div className="app-topbar"><h1>Nilai Saya</h1></div>
        <div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data tidak ditemukan</p></div>
      </div>
    );
  }

  const sortedTahap = [...tahaps].sort((a, b) => a.urutan - b.urutan);
  const materiByTahap = (tahapId: string) => {
    const materiIds = new Set(jadwals.filter(j => j.tahap_id === tahapId).map(j => j.materi_id));
    return materis.filter(m => materiIds.has(m.id));
  };

  return (
    <div>
      <div className="app-topbar"><h1>Nilai Saya</h1></div>
      <div className="app-content p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {sortedTahap.map(t => (
            <button
              key={t.id}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selTahap === t.id ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground border border-border'}`}
              onClick={() => setSelTahap(selTahap === t.id ? null : t.id)}
            >
              {t.nama_tahap}
            </button>
          ))}
        </div>

        {selTahap && (
          <div className="space-y-3">
            {materiByTahap(selTahap).map(m => {
              const nh = nilaiHarian.filter(n => n.siswa_id === siswa.id && n.tahap_id === selTahap && n.materi_id === m.id);
              const nu = nilaiUlangan.find(n => n.siswa_id === siswa.id && n.tahap_id === selTahap && n.materi_id === m.id);
              const jt = jamTambahan.find(j => j.siswa_id === siswa.id && j.tahap_id === selTahap && j.materi_id === m.id && j.status === 'selesai' && j.nilai_tambahan !== undefined);
              const ip = hitungIP(nh, nu, jt?.nilai_tambahan);
              return (
                <div key={m.id} className="app-card">
                  <div className="font-semibold text-foreground">{m.nama_materi} <span className="text-xs text-muted-foreground">(SKT: {m.skt})</span></div>
                  {nh.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Nilai Harian:</p>
                      <div className="flex flex-wrap gap-1">
                        {nh.sort((a, b) => a.pertemuan_ke - b.pertemuan_ke).map(n => (
                          <span key={n.id} className="badge-pill bg-muted text-foreground">P{n.pertemuan_ke}: {n.nilai}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {nu && <p className="text-sm mt-1 text-muted-foreground">Ulangan: <span className="font-semibold text-foreground">{nu.nilai}</span></p>}
                  {ip && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total: <span className="font-bold text-foreground">{ip.total.toFixed(1)}</span></span>
                      <span className={`badge-pill ${ip.lulusKKM ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                        {ip.predikat} ({ip.bobot.toFixed(2)})
                      </span>
                    </div>
                  )}
                  {!ip && nh.length === 0 && <p className="text-sm text-muted-foreground mt-1">Belum ada nilai</p>}
                </div>
              );
            })}
            {(() => {
              const iptResult = hitungIPT(siswa.id, selTahap, materiByTahap(selTahap), nilaiHarian, nilaiUlangan, jamTambahan);
              if (!iptResult) return null;
              return (
                <div className="app-card bg-accent/50 border-primary/20 text-center">
                  <p className="text-sm text-accent-foreground">IPT</p>
                  <p className="text-2xl font-bold text-primary">{iptResult.ipt.toFixed(2)}</p>
                </div>
              );
            })()}
          </div>
        )}

        {!selTahap && <p className="text-center text-muted-foreground py-8">Pilih tahap untuk melihat nilai</p>}
        {selTahap && materiByTahap(selTahap).length === 0 && (
          <p className="text-center text-muted-foreground py-8">Tidak ada materi untuk tahap ini di kelompok Anda</p>
        )}
        {enrollment && enrollment.status !== 'aktif' && (
          <p className="text-center text-muted-foreground py-2">Status siswa: {enrollment.status}</p>
        )}
      </div>
    </div>
  );
}
