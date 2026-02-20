'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Siswa, JamTambahan, Tahap, Materi, TahunAkademik } from '@/types/firestore';

export default function StudentJamTambahan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [jtList, setJtList] = useState<JamTambahan[]>([]);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);

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
        setJtList(data.jam_tambahan || []);
      } catch (error) {
        console.error('Error loading jam tambahan:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat jam tambahan',
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
        <div className="app-topbar"><h1>Jam Tambahan</h1></div>
        <div className="app-content p-4 flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!siswa) {
    return (
      <div>
        <div className="app-topbar"><h1>Jam Tambahan</h1></div>
        <div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data tidak ditemukan</p></div>
      </div>
    );
  }

  const myJT = jtList.filter(j => j.siswa_id === siswa.id);

  return (
    <div>
      <div className="app-topbar"><h1>Jam Tambahan</h1></div>
      <div className="app-content p-4 space-y-3">
        {myJT.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">Tidak ada jam tambahan</p>
            <p className="text-sm mt-1">Semua nilai Anda memenuhi KKM</p>
          </div>
        )}
        {myJT.map(jt => {
          const tahap = tahaps.find(t => t.id === jt.tahap_id);
          const materi = materis.find(m => m.id === jt.materi_id);
          const nilaiAkhir = jt.nilai_tambahan ?? jt.nilai_awal;
          return (
            <div key={jt.id} className="app-card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">{materi?.nama_materi || '-'}</div>
                  <div className="text-sm text-muted-foreground">{tahap?.nama_tahap || '-'}</div>
                  <div className="text-sm text-muted-foreground">Nilai: <span className="text-destructive font-semibold">{nilaiAkhir.toFixed(1)}</span></div>
                  {jt.keterangan && <div className="text-xs text-muted-foreground mt-1">{jt.keterangan}</div>}
                </div>
                <div className="text-right">
                  <span className={`badge-pill ${jt.status === 'selesai' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                    {jt.status === 'selesai' ? 'Selesai' : 'Pending'}
                  </span>
                  <div className="text-sm font-semibold text-foreground mt-1">{jt.jumlah_menit} menit</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
