'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BOBOT_TABLE } from '@/lib/store';

export default function DataBobot() {
  const router = useRouter();
  
  return (
    <div>
      <div className="app-topbar">
        <button onClick={() => router.push('/admin/data')} className="p-1"><ArrowLeft size={22} /></button>
        <h1>Tabel Bobot</h1>
        <span className="ml-auto text-sm opacity-80">{BOBOT_TABLE.length} data</span>
      </div>
      <div className="app-content p-4 space-y-3">
        <div className="app-card animate-fade-in">
          <p className="text-xs text-muted-foreground mb-3">Data ini bersifat tetap dan tidak dapat diubah</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-semibold text-foreground">Predikat</th>
                  <th className="text-center py-2 font-semibold text-foreground">Bobot</th>
                  <th className="text-center py-2 font-semibold text-foreground">Min</th>
                  <th className="text-center py-2 font-semibold text-foreground">Max</th>
                </tr>
              </thead>
              <tbody>
                {BOBOT_TABLE.map(b => (
                  <tr key={b.predikat} className="border-b border-border/50">
                    <td className="py-2.5 font-semibold text-primary">{b.predikat}</td>
                    <td className="py-2.5 text-center text-foreground">{b.bobot.toFixed(2)}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{b.min}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{b.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
