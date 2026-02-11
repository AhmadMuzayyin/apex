import { useState, useCallback } from 'react';

// ===== TYPES =====
export interface Tahap { id: string; nama: string; urutan: number; }
export interface Materi { id: string; nama: string; skt: number; }
export interface Lencana { id: string; nama: string; pencapaian: string; syaratNilaiMin: number; icon: string; }
export interface Kelompok { id: string; nama: string; }
export interface Siswa { id: string; nomorInduk: string; nama: string; kelompokId: string; angkatan: number; qrCode?: string; }
export interface AppUser { id: string; code: string; role: 'admin' | 'siswa'; password: string; siswaId?: string; }
export interface NilaiHarian { id: string; siswaId: string; tahapId: string; materiId: string; pertemuan: number; nilai: number; keterangan: string; tanggal?: string; }
export interface NilaiUlangan { id: string; siswaId: string; tahapId: string; materiId: string; nilai: number; keterangan: string; }
export interface JamTambahan { id: string; siswaId: string; tahapId: string; materiId: string; nilaiTotal: number; jumlahJam: number; status: 'pending' | 'selesai'; keterangan: string; nilaiTambahan?: number; }

// Jadwal Akademik
export type DayOfWeek = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
export interface JadwalRutin { id: string; hari: DayOfWeek; tahapId: string; materiId: string; kelompokId: string; jamMulai: string; jamSelesai: string; }
export interface JadwalKhusus { id: string; tanggal: string; tahapId: string; materiId: string; kelompokId: string; jamMulai: string; jamSelesai: string; keterangan: string; }
export interface HariLibur { id: string; tanggal: string; keterangan: string; }

// Absensi
export type StatusAbsensi = 'hadir' | 'izin' | 'sakit' | 'alpha' | 'terlambat';
export interface Absensi { id: string; siswaId: string; jadwalId: string; tanggal: string; status: StatusAbsensi; waktuAbsen?: string; keterangan?: string; }

export const BOBOT_TABLE = [
  { predikat: 'AA', bobot: 4.00, min: 95, max: 100 },
  { predikat: 'A', bobot: 3.80, min: 85, max: 94 },
  { predikat: 'BB', bobot: 3.50, min: 80, max: 84 },
  { predikat: 'B', bobot: 3.20, min: 70, max: 79 },
  { predikat: 'CC', bobot: 2.80, min: 65, max: 69 },
  { predikat: 'C', bobot: 2.50, min: 40, max: 64 },
  { predikat: 'E', bobot: 2.00, min: 0, max: 39 },
];

// ===== GENERIC STORE =====
export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function load<T>(key: string): T[] {
  try {
    const data = localStorage.getItem('app_' + key);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem('app_' + key, JSON.stringify(data));
}

export function useStore<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>(() => load(key));

  const refresh = useCallback(() => setItems(load(key)), [key]);

  const add = useCallback((item: Omit<T, 'id'>) => {
    const newItem = { ...item, id: generateId() } as T;
    const updated = [...load<T>(key), newItem];
    save(key, updated);
    setItems(updated);
    return newItem;
  }, [key]);

  const update = useCallback((item: T) => {
    const updated = load<T>(key).map(i => i.id === item.id ? item : i);
    save(key, updated);
    setItems(updated);
  }, [key]);

  const remove = useCallback((id: string) => {
    const updated = load<T>(key).filter(i => i.id !== id);
    save(key, updated);
    setItems(updated);
  }, [key]);

  const replaceAll = useCallback((newItems: T[]) => {
    save(key, newItems);
    setItems(newItems);
  }, [key]);

  return { items, add, update, remove, replaceAll, refresh };
}

// ===== COMPUTATIONS =====
export function getBobot(nilai: number) {
  return BOBOT_TABLE.find(b => nilai >= b.min && nilai <= b.max) || BOBOT_TABLE[BOBOT_TABLE.length - 1];
}

export function hitungIP(nilaiHarian: NilaiHarian[], nilaiUlangan?: NilaiUlangan, nilaiJamTambahan?: number) {
  if (nilaiHarian.length === 0) return null;
  
  // Jika ada nilai jam tambahan, tambahkan ke rata-rata nilai harian
  let rataHarian: number;
  if (nilaiJamTambahan !== undefined && nilaiJamTambahan > 0) {
    const totalNilaiHarian = nilaiHarian.reduce((s, n) => s + n.nilai, 0);
    rataHarian = (totalNilaiHarian + nilaiJamTambahan) / (nilaiHarian.length + 1);
  } else {
    rataHarian = nilaiHarian.reduce((s, n) => s + n.nilai, 0) / nilaiHarian.length;
  }
  
  if (!nilaiUlangan) return null;
  const total = rataHarian * 0.6 + nilaiUlangan.nilai * 0.4;
  const bobot = getBobot(total);
  return { rataHarian: Math.round(rataHarian * 100) / 100, nilaiUlanganVal: nilaiUlangan.nilai, total: Math.round(total * 100) / 100, bobot: bobot.bobot, predikat: bobot.predikat, lulusKKM: total >= 40 };
}

export function hitungIPT(siswaId: string, tahapId: string, materiList: Materi[], nhAll: NilaiHarian[], nuAll: NilaiUlangan[]) {
  let totalBS = 0, totalS = 0, allComplete = true;
  materiList.forEach(m => {
    const nh = nhAll.filter(n => n.siswaId === siswaId && n.tahapId === tahapId && n.materiId === m.id);
    const nu = nuAll.find(n => n.siswaId === siswaId && n.tahapId === tahapId && n.materiId === m.id);
    const ip = hitungIP(nh, nu);
    if (!ip) { allComplete = false; return; }
    totalBS += ip.bobot * m.skt;
    totalS += m.skt;
  });
  if (!allComplete || totalS === 0) return null;
  return { ipt: Math.round((totalBS / totalS) * 100) / 100, totalSKT: totalS, totalBobotSKT: Math.round(totalBS * 100) / 100 };
}

export function hitungIPK(siswaId: string, tahapList: Tahap[], materiList: Materi[], nhAll: NilaiHarian[], nuAll: NilaiUlangan[]) {
  let totalIPT = 0, count = 0;
  tahapList.forEach(t => {
    const r = hitungIPT(siswaId, t.id, materiList, nhAll, nuAll);
    if (r) { totalIPT += r.ipt; count++; }
  });
  if (count === 0) return null;
  return { ipk: Math.round((totalIPT / count) * 100) / 100, totalTahap: count, totalIPT: Math.round(totalIPT * 100) / 100 };
}

// ===== INITIALIZATION =====
export function initializeApp() {
  const users = load<AppUser>('users');
  if (users.length === 0) {
    save('users', [{ id: 'admin-1', code: 'admin', role: 'admin' as const, password: 'admin123' }]);
  }
}
