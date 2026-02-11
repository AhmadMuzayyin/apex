import type { NilaiHarian, NilaiUlangan, Materi, Tahap, JamTambahan } from '@/types/firestore';

const BOBOT_TABLE = [
  { predikat: 'AA', bobot: 4.00, min: 95, max: 100 },
  { predikat: 'A', bobot: 3.80, min: 85, max: 94 },
  { predikat: 'BB', bobot: 3.50, min: 80, max: 84 },
  { predikat: 'B', bobot: 3.20, min: 70, max: 79 },
  { predikat: 'CC', bobot: 2.80, min: 65, max: 69 },
  { predikat: 'C', bobot: 2.50, min: 40, max: 64 },
  { predikat: 'E', bobot: 2.00, min: 0, max: 39 },
];

export function getBobot(nilai: number) {
  return BOBOT_TABLE.find(b => nilai >= b.min && nilai <= b.max) || BOBOT_TABLE[BOBOT_TABLE.length - 1];
}

export function hitungIP(nilaiHarian: NilaiHarian[], nilaiUlangan?: NilaiUlangan, nilaiJamTambahan?: number) {
  if (nilaiHarian.length === 0) return null;
  
  // Jika ada nilai jam tambahan (selesai), gunakan nilai jam tambahan sebagai PENGGANTI rata harian
  // Bukan ditambahkan, tapi replace - karena jam tambahan adalah remedial
  let rataHarian: number;
  if (nilaiJamTambahan !== undefined && nilaiJamTambahan > 0) {
    rataHarian = nilaiJamTambahan; // REPLACE dengan nilai jam tambahan
  } else {
    rataHarian = nilaiHarian.reduce((s, n) => s + n.nilai, 0) / nilaiHarian.length;
  }
  
  if (!nilaiUlangan) return null;
  const total = rataHarian * 0.6 + nilaiUlangan.nilai * 0.4;
  const bobot = getBobot(total);
  return { 
    rataHarian: Math.round(rataHarian * 100) / 100, 
    nilaiUlanganVal: nilaiUlangan.nilai, 
    total: Math.round(total * 100) / 100, 
    bobot: bobot.bobot, 
    predikat: bobot.predikat, 
    lulusKKM: total >= 40 
  };
}

export function hitungIPT(
  siswaId: string, 
  tahapId: string, 
  materiList: Materi[], 
  nhAll: NilaiHarian[], 
  nuAll: NilaiUlangan[],
  jtAll?: JamTambahan[]
) {
  let totalBS = 0, totalS = 0, allComplete = true;
  
  materiList.forEach(m => {
    const nh = nhAll.filter(n => n.siswa_id === siswaId && n.tahap_id === tahapId && n.materi_id === m.id);
    const nu = nuAll.find(n => n.siswa_id === siswaId && n.tahap_id === tahapId && n.materi_id === m.id);
    
    // Cari nilai jam tambahan yang sudah selesai
    const jt = jtAll?.find(
      j => j.siswa_id === siswaId && j.tahap_id === tahapId && j.materi_id === m.id && j.status === 'selesai' && j.nilai_tambahan !== undefined
    );
    
    const ip = hitungIP(nh, nu, jt?.nilai_tambahan);
    
    if (!ip) { 
      allComplete = false; 
      return; 
    }
    totalBS += ip.bobot * m.skt;
    totalS += m.skt;
  });
  
  if (!allComplete || totalS === 0) return null;
  return { ipt: totalBS / totalS };
}

export function hitungIPK(
  siswaId: string, 
  tahapList: Tahap[], 
  materiList: Materi[], 
  nhAll: NilaiHarian[], 
  nuAll: NilaiUlangan[],
  jtAll?: JamTambahan[]
) {
  let totalIPT = 0, countIPT = 0;
  tahapList.forEach(t => {
    const ipt = hitungIPT(siswaId, t.id, materiList, nhAll, nuAll, jtAll);
    if (ipt) { totalIPT += ipt.ipt; countIPT++; }
  });
  if (countIPT === 0) return null;
  return { ipk: totalIPT / countIPT };
}
