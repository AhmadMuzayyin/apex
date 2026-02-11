'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useStore, Siswa, JamTambahan as JT, Tahap, Materi } from '@/lib/store';

export default function StudentJamTambahan() {
  const { user } = useAuth();
  const { items: siswaList } = useStore<Siswa>('siswa');
  const { items: jtList } = useStore<JT>('jamTambahan');
  const { items: tahapList } = useStore<Tahap>('tahap');
  const { items: materiList } = useStore<Materi>('materi');

  const siswa = siswaList.find(s => s.id === user?.siswaId);
  if (!siswa) return <div><div className="app-topbar"><h1>Jam Tambahan</h1></div><div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data tidak ditemukan</p></div></div>;

  const myJT = jtList.filter(j => j.siswaId === siswa.id);

  return (
    <div>
      <div className="app-topbar"><h1>Jam Tambahan</h1></div>
      <div className="app-content p-4 space-y-3">
        {myJT.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">🎉 Tidak ada jam tambahan</p>
            <p className="text-sm mt-1">Semua nilai Anda memenuhi KKM</p>
          </div>
        )}
        {myJT.map(jt => {
          const tahap = tahapList.find(t => t.id === jt.tahapId);
          const materi = materiList.find(m => m.id === jt.materiId);
          return (
            <div key={jt.id} className="app-card">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-foreground">{materi?.nama || '-'}</div>
                  <div className="text-sm text-muted-foreground">{tahap?.nama || '-'}</div>
                  <div className="text-sm text-muted-foreground">Nilai: <span className="text-destructive font-semibold">{jt.nilaiTotal.toFixed(1)}</span></div>
                  {jt.keterangan && <div className="text-xs text-muted-foreground mt-1">{jt.keterangan}</div>}
                </div>
                <div className="text-right">
                  <span className={`badge-pill ${jt.status === 'selesai' ? 'bg-success/10 text-success' : 'bg-secondary/10 text-secondary'}`}>
                    {jt.status === 'selesai' ? '✓ Selesai' : '⏳ Pending'}
                  </span>
                  <div className="text-sm font-semibold text-foreground mt-1">{jt.jumlahJam} menit</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
