'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useStore, Siswa, Tahap, Materi, NilaiHarian as NH, NilaiUlangan as NU, Lencana, hitungIP, hitungIPT, hitungIPK, getBobot } from '@/lib/store';

export default function StudentPrestasi() {
  const { user } = useAuth();
  const { items: siswaList } = useStore<Siswa>('siswa');
  const { items: tahapList } = useStore<Tahap>('tahap');
  const { items: materiList } = useStore<Materi>('materi');
  const { items: nhAll } = useStore<NH>('nilaiHarian');
  const { items: nuAll } = useStore<NU>('nilaiUlangan');
  const { items: lencanaList } = useStore<Lencana>('lencana');

  const siswa = siswaList.find(s => s.id === user?.siswaId);
  if (!siswa) return <div><div className="app-topbar"><h1>Prestasi</h1></div><div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data tidak ditemukan</p></div></div>;

  const ipkResult = hitungIPK(siswa.id, tahapList, materiList, nhAll, nuAll);

  // Collect badges
  const badges: { lencana: Lencana; tahap: string; materi: string }[] = [];
  tahapList.forEach(t => {
    materiList.forEach(m => {
      const nh = nhAll.filter(n => n.siswaId === siswa.id && n.tahapId === t.id && n.materiId === m.id);
      const nu = nuAll.find(n => n.siswaId === siswa.id && n.tahapId === t.id && n.materiId === m.id);
      const ip = hitungIP(nh, nu);
      if (ip) {
        lencanaList.filter(l => ip.total >= l.syaratNilaiMin).forEach(l => {
          badges.push({ lencana: l, tahap: t.nama, materi: m.nama });
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
            <p className="text-sm text-muted-foreground">{ipkResult.totalTahap} tahap selesai</p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground">IPT per Tahap</h3>
          {tahapList.sort((a, b) => a.urutan - b.urutan).map(t => {
            const iptResult = hitungIPT(siswa.id, t.id, materiList, nhAll, nuAll);
            return (
              <div key={t.id} className="app-card flex justify-between items-center">
                <span className="font-medium text-foreground">{t.nama}</span>
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
              <span className="text-2xl">{b.lencana.icon}</span>
              <div>
                <div className="font-semibold text-foreground">{b.lencana.nama}</div>
                <div className="text-xs text-muted-foreground">{b.tahap} • {b.materi}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
