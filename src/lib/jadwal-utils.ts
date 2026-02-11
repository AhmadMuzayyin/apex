import { DayOfWeek, JadwalRutin, JadwalKhusus, HariLibur } from './store';
import type { Libur } from '@/types/firestore';

export const DAYS_OF_WEEK: { value: DayOfWeek; label: string }[] = [
  { value: 'senin', label: 'Senin' },
  { value: 'selasa', label: 'Selasa' },
  { value: 'rabu', label: 'Rabu' },
  { value: 'kamis', label: 'Kamis' },
  { value: 'jumat', label: 'Jumat' },
  { value: 'sabtu', label: 'Sabtu' },
  { value: 'minggu', label: 'Minggu' },
];

export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  return days[date.getDay()];
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function isHoliday(date: Date, holidays: HariLibur[]): boolean {
  const dateStr = formatDate(date);
  return holidays.some(h => h.tanggal === dateStr);
}

export function getJadwalForDate(
  date: Date,
  jadwalRutin: JadwalRutin[],
  jadwalKhusus: JadwalKhusus[],
  hariLibur: HariLibur[]
): (JadwalRutin | JadwalKhusus)[] {
  const dateStr = formatDate(date);

  // Cek hari libur
  if (isHoliday(date, hariLibur)) {
    return [];
  }

  // Cek jadwal khusus dulu (prioritas lebih tinggi)
  const khusus = jadwalKhusus.filter(j => j.tanggal === dateStr);
  if (khusus.length > 0) {
    return khusus;
  }

  // Jika tidak ada jadwal khusus, gunakan jadwal rutin
  const dayOfWeek = getDayOfWeek(date);
  return jadwalRutin.filter(j => j.hari === dayOfWeek);
}

export function getTodayJadwal(
  jadwalRutin: JadwalRutin[],
  jadwalKhusus: JadwalKhusus[],
  hariLibur: HariLibur[]
): (JadwalRutin | JadwalKhusus)[] {
  return getJadwalForDate(new Date(), jadwalRutin, jadwalKhusus, hariLibur);
}

export function generateQRCode(siswaId: string, nomorInduk: string): string {
  return `SISWA:${siswaId}:${nomorInduk}`;
}

export function parseQRCode(qrData: string): { siswaId: string; nomorInduk: string } | null {
  if (!qrData.startsWith('SISWA:')) return null;
  const parts = qrData.split(':');
  if (parts.length !== 3) return null;
  return { siswaId: parts[1], nomorInduk: parts[2] };
}

// ============================================
// Firestore Libur Utils
// ============================================

export const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getHariIndo(date: Date): string {
  return HARI_INDO[date.getDay()];
}

export function isLibur(tanggal: string, liburList: Libur[]): boolean {
  const date = new Date(tanggal);
  const hariNama = getHariIndo(date);

  for (const libur of liburList) {
    if (libur.tipe === 'tanggal') {
      if (libur.nilai === tanggal) {
        return true;
      }
    } else if (libur.tipe === 'hari') {
      if (libur.nilai === hariNama) {
        return true;
      }
    }
  }

  return false;
}

export function getLiburKeterangan(tanggal: string, liburList: Libur[]): string | null {
  const date = new Date(tanggal);
  const hariNama = getHariIndo(date);

  for (const libur of liburList) {
    if (libur.tipe === 'tanggal' && libur.nilai === tanggal) {
      return libur.keterangan;
    }
    if (libur.tipe === 'hari' && libur.nilai === hariNama) {
      return libur.keterangan;
    }
  }

  return null;
}
