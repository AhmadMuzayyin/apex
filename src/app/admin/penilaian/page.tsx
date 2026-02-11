'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, PenLine, FileCheck } from 'lucide-react';

const items = [
  { icon: PenLine, label: 'Nilai Harian', desc: 'Input nilai harian per pertemuan', path: '/admin/penilaian/harian' },
  { icon: FileCheck, label: 'Nilai Ulangan', desc: 'Input nilai ulangan per materi', path: '/admin/penilaian/ulangan' },
];

export default function PenilaianMenu() {
  const router = useRouter();
  return (
    <div>
      <div className="app-topbar"><h1>Penilaian</h1></div>
      <div className="app-content p-4 space-y-3">
        <div className="app-card bg-accent/50 border-primary/20">
          <p className="text-sm text-accent-foreground">💡 IP, IPT, dan IPK dihitung otomatis berdasarkan nilai yang diinput. Lihat hasilnya di menu <strong>Laporan</strong>.</p>
        </div>
        {items.map((item, i) => (
          <button key={item.path} className="menu-item w-full text-left animate-fade-in" style={{ animationDelay: `${i * 40}ms` }} onClick={() => router.push(item.path)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-primary"><item.icon size={20} /></div>
              <div>
                <div className="font-semibold text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
