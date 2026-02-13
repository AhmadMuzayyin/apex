'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, GraduationCap, BookOpen, Users, BarChart3, Award, Calendar, CalendarOff, CalendarClock, UserPlus } from 'lucide-react';

const items = [
  { icon: CalendarClock, label: 'Tahun Akademik', desc: 'Periode tahun akademik', path: '/admin/data/tahun-akademik' },
  { icon: UserPlus, label: 'Enrollment Siswa', desc: 'Daftar siswa per tahun', path: '/admin/enrollment', highlight: true },
  { icon: GraduationCap, label: 'Tahap', desc: 'Tahap pembelajaran', path: '/admin/data/tahap' },
  { icon: BookOpen, label: 'Materi', desc: 'Materi pelajaran & SKT', path: '/admin/data/materi' },
  { icon: Users, label: 'Kelompok', desc: 'Kelompok belajar', path: '/admin/data/kelompok' },
  { icon: Calendar, label: 'Jadwal', desc: 'Jadwal rutin mingguan', path: '/admin/data/jadwal' },
  { icon: CalendarOff, label: 'Libur', desc: 'Hari libur & tanggal merah', path: '/admin/data/libur' },
  { icon: BarChart3, label: 'Bobot', desc: 'Tabel bobot (read only)', path: '/admin/data/bobot' },
  { icon: Award, label: 'Lencana', desc: 'Lencana pencapaian', path: '/admin/data/lencana' },
];

export default function DataMasterMenu() {
  const router = useRouter();
  return (
    <div>
      <div className="app-topbar"><h1>Data Master</h1></div>
      <div className="app-content p-4 space-y-3">
        {items.map((item, i) => (
          <button
            key={item.path}
            className={`menu-item w-full text-left animate-fade-in ${item.highlight ? 'ring-2 ring-primary' : ''}`}
            style={{ animationDelay: `${i * 40}ms` }}
            onClick={() => router.push(item.path)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.highlight ? 'bg-primary text-white' : 'bg-accent text-primary'}`}>
                <item.icon size={20} />
              </div>
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
