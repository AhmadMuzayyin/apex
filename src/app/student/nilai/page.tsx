'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore, Siswa, Tahap, Materi, NilaiHarian as NH, NilaiUlangan as NU, hitungIP, hitungIPT } from '@/lib/store';

export default function StudentNilai() {
  const { user } = useAuth();
  const { items: siswaList } = useStore<Siswa>('siswa');
  const { items: tahapList } = useStore<Tahap>('tahap');
  const { items: materiList } = useStore<Materi>('materi');
  const { items: nhAll } = useStore<NH>('nilaiHarian');
  const { items: nuAll } = useStore<NU>('nilaiUlangan');

  const siswa = siswaList.find(s => s.id === user?.siswaId);
  const [selTahap, setSelTahap] = useState<string | null>(null);

  if (!siswa) return <div><div className="app-topbar"><h1>Nilai Saya</h1></div><div className="app-content p-4"><p className="text-center text-muted-foreground py-12">Data tidak ditemukan</p></div></div>;

  const sortedTahap = tahapList.sort((a, b) => a.urutan - b.urutan);

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
              {t.nama}
            </button>
          ))}
        </div>

        {selTahap && (
          <div className="space-y-3">
            {materiList.map(m => {
              const nh = nhAll.filter(n => n.siswaId === siswa.id && n.tahapId === selTahap && n.materiId === m.id);
              const nu = nuAll.find(n => n.siswaId === siswa.id && n.tahapId === selTahap && n.materiId === m.id);
              const ip = hitungIP(nh, nu);
              return (
                <div key={m.id} className="app-card">
                  <div className="font-semibold text-foreground">{m.nama} <span className="text-xs text-muted-foreground">(SKT: {m.skt})</span></div>
                  {nh.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Nilai Harian:</p>
                      <div className="flex flex-wrap gap-1">
                        {nh.sort((a, b) => a.pertemuan - b.pertemuan).map(n => (
                          <span key={n.id} className="badge-pill bg-muted text-foreground">P{n.pertemuan}: {n.nilai}</span>
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
              const iptResult = hitungIPT(siswa.id, selTahap, materiList, nhAll, nuAll);
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
      </div>
    </div>
  );
}
