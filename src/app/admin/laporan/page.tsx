'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, BookOpen, Users, Award } from 'lucide-react';
import { masterDataService } from '@/services/masterDataService';
import type { Tahap, Materi, Kelompok, Siswa, NilaiHarian, NilaiUlangan, JamTambahan, TahunAkademik } from '@/types/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { hitungIP, hitungIPT, hitungIPK, getBobot } from '@/lib/calculations';

export default function Laporan() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [nilaiHarianAll, setNilaiHarianAll] = useState<NilaiHarian[]>([]);
  const [nilaiUlanganAll, setNilaiUlanganAll] = useState<NilaiUlangan[]>([]);
  const [jamTambahanAll, setJamTambahanAll] = useState<JamTambahan[]>([]);

  const [selSiswa, setSelSiswa] = useState('');
  const [selKelompok, setSelKelompok] = useState('');
  const [selTahap, setSelTahap] = useState('');

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadData();
    }
  }, [selectedTahunAkademik]);

  const loadTahunAkademik = async () => {
    try {
      const taRes = await fetch('/api/tahun-akademik');
      const taData = await taRes.json();
      
      if (taData.success) {
        setTahunAkademik(taData.data);
        
        // Set active tahun akademik as default
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

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tahapData, materiData, kelompokData, nhData, nuData, jtData, enrollmentRes] = await Promise.all([
        masterDataService.getAllTahap(),
        masterDataService.getAllMateri(),
        masterDataService.getAllKelompok(),
        masterDataService.getAllNilaiHarian(),
        masterDataService.getAllNilaiUlangan(),
        masterDataService.getAllJamTambahan(),
        fetch(`/api/enrollment?tahun_akademik_id=${selectedTahunAkademik}`)
      ]);

      // Filter tahap by tahun akademik
      const filteredTahap = tahapData.filter(t => t.tahun_akademik_id === selectedTahunAkademik);
      const tahapIds = filteredTahap.map(t => t.id);

      // Filter nilai by tahap in selected tahun akademik
      const filteredNH = nhData.filter(nh => tahapIds.includes(nh.tahap_id));
      const filteredNU = nuData.filter(nu => tahapIds.includes(nu.tahap_id));
      const filteredJT = jtData.filter(jt => tahapIds.includes(jt.tahap_id));

      // Get enrolled siswa for this tahun akademik
      const enrollmentData = await enrollmentRes.json();
      let enrolledSiswa: Siswa[] = [];
      if (enrollmentData.success) {
        enrolledSiswa = enrollmentData.data
          .filter((e: any) => e.siswa)
          .map((e: any) => e.siswa);
      }

      setTahaps(filteredTahap);
      setMateris(materiData);
      setKelompoks(kelompokData);
      setSiswas(enrolledSiswa);
      setNilaiHarianAll(filteredNH);
      setNilaiUlanganAll(filteredNU);
      setJamTambahanAll(filteredJT);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTahunAkademik, toast]);

  // Per Siswa Report
  const renderPerSiswa = () => {
    const siswa = siswas.find(s => s.id === selSiswa);
    if (!siswa) return <p className="text-center text-muted-foreground py-8">Pilih siswa untuk melihat laporan</p>;
    const ipkResult = hitungIPK(siswa.id, tahaps, materis, nilaiHarianAll, nilaiUlanganAll, jamTambahanAll);

    return (
      <div className="space-y-4">
        <div className="app-card">
          <div className="font-bold text-lg text-foreground">{siswa.nama_lengkap}</div>
          <div className="text-sm text-muted-foreground">
            {siswa.no_induk} • Angkatan {siswa.angkatan}
          </div>
          {ipkResult && (
            <div className="mt-2 p-3 rounded-xl bg-accent">
              <span className="text-sm text-accent-foreground">IPK: </span>
              <span className="text-xl font-bold text-primary">{ipkResult.ipk.toFixed(2)}</span>
              <span className="text-sm text-accent-foreground ml-2">
                ({getBobot(ipkResult.ipk * 25).predikat})
              </span>
            </div>
          )}
        </div>
        {tahaps.sort((a, b) => a.urutan - b.urutan).map(tahap => {
          const iptResult = hitungIPT(siswa.id, tahap.id, materis, nilaiHarianAll, nilaiUlanganAll, jamTambahanAll);
          return (
            <div key={tahap.id} className="app-card">
              <div className="font-semibold text-foreground mb-2">{tahap.nama_tahap}</div>
              <div className="space-y-2">
                {materis.map(m => {
                  const nh = nilaiHarianAll.filter(
                    n => n.siswa_id === siswa.id && n.tahap_id === tahap.id && n.materi_id === m.id
                  );
                  const nu = nilaiUlanganAll.find(
                    n => n.siswa_id === siswa.id && n.tahap_id === tahap.id && n.materi_id === m.id
                  );
                  // Cari nilai jam tambahan yang sudah selesai
                  const jt = jamTambahanAll.find(
                    j => j.siswa_id === siswa.id && j.tahap_id === tahap.id && j.materi_id === m.id && j.status === 'selesai' && j.nilai_tambahan !== undefined
                  );
                  
                  const ip = hitungIP(nh, nu, jt?.nilai_tambahan);
                  if (!ip) return (
                    <div key={m.id} className="text-sm text-muted-foreground">
                      {m.nama_materi}: belum ada nilai
                    </div>
                  );
                  return (
                    <div key={m.id} className="flex justify-between items-center text-sm py-1 border-b border-border/30 last:border-0">
                      <span className="text-foreground font-medium">
                        {m.nama_materi}
                        {jt && <span className="ml-1 text-[10px] text-blue-500">+JT</span>}
                      </span>
                      <div className="text-right">
                        <span className="text-muted-foreground">
                          H:{ip.rataHarian.toFixed(0)} U:{ip.nilaiUlanganVal}{' '}
                        </span>
                        <span className="font-semibold text-foreground">= {ip.total.toFixed(1)}</span>
                        <span className={`ml-1 badge-pill text-[10px] ${ip.lulusKKM ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                          {ip.predikat}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {iptResult && (
                <div className="mt-2 pt-2 border-t border-border text-sm">
                  <span className="text-muted-foreground">IPT: </span>
                  <span className="font-bold text-primary">{iptResult.ipt.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Per Kelompok Report
  const renderPerKelompok = () => {
    if (!selKelompok) 
      return <p className="text-center text-muted-foreground py-8">Pilih kelompok untuk melihat laporan</p>;
    
    // Note: Kelompok filter currently not supported with enrollment system
    // Students are shown per tahun akademik, not filtered by kelompok
    const students = siswas;
    
    if (students.length === 0) {
      return <p className="text-center text-muted-foreground py-8">Tidak ada siswa terdaftar untuk tahun akademik ini</p>;
    }

    return (
      <div className="space-y-4">
        {students.map((siswa, idx) => {
          const ipkResult = hitungIPK(siswa.id, tahaps, materis, nilaiHarianAll, nilaiUlanganAll, jamTambahanAll);
          
          return (
            <div key={siswa.id} className="app-card">
              {/* Header Siswa */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-primary">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-foreground">{siswa.nama_lengkap}</div>
                    <div className="text-xs text-muted-foreground">{siswa.no_induk}</div>
                  </div>
                </div>
                {ipkResult && (
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">IPK</div>
                    <div className="font-bold text-lg text-primary">{ipkResult.ipk.toFixed(2)}</div>
                  </div>
                )}
              </div>

              {/* Tabel Nilai */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Tahap</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Materi</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">H</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">U</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">IP</th>
                      <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tahaps.sort((a, b) => a.urutan - b.urutan).map((tahap, tahapIdx) => {
                      const iptResult = hitungIPT(siswa.id, tahap.id, materis, nilaiHarianAll, nilaiUlanganAll, jamTambahanAll);
                      
                      return materis.map((m, materiIdx) => {
                        const nh = nilaiHarianAll.filter(
                          n => n.siswa_id === siswa.id && n.tahap_id === tahap.id && n.materi_id === m.id
                        );
                        const nu = nilaiUlanganAll.find(
                          n => n.siswa_id === siswa.id && n.tahap_id === tahap.id && n.materi_id === m.id
                        );
                        const jt = jamTambahanAll.find(
                          j => j.siswa_id === siswa.id && j.tahap_id === tahap.id && j.materi_id === m.id && j.status === 'selesai' && j.nilai_tambahan !== undefined
                        );
                        const ip = hitungIP(nh, nu, jt?.nilai_tambahan);
                        
                        const isFirstMateriInTahap = materiIdx === 0;
                        const isLastMateriInTahap = materiIdx === materis.length - 1;
                        
                        return (
                          <tr key={`${tahap.id}-${m.id}`} className={`border-b border-border/30 ${isLastMateriInTahap ? 'border-b-2 border-border' : ''}`}>
                            {/* Tahap - hanya tampil di baris pertama per tahap */}
                            {isFirstMateriInTahap ? (
                              <td rowSpan={materis.length} className="py-2 px-2 font-medium text-foreground align-top">
                                {tahap.nama_tahap}
                                {iptResult && (
                                  <div className="text-[10px] text-muted-foreground mt-1">
                                    IPT: {iptResult.ipt.toFixed(2)}
                                  </div>
                                )}
                              </td>
                            ) : null}
                            
                            {/* Materi */}
                            <td className="py-2 px-2 text-foreground">
                              {m.nama_materi}
                              {jt && <span className="ml-1 text-[9px] text-blue-500">+JT</span>}
                            </td>
                            
                            {/* Data Nilai */}
                            {ip ? (
                              <>
                                <td className="py-2 px-2 text-center text-muted-foreground">{ip.rataHarian.toFixed(0)}</td>
                                <td className="py-2 px-2 text-center text-muted-foreground">{ip.nilaiUlanganVal}</td>
                                <td className="py-2 px-2 text-center font-semibold text-foreground">{ip.total.toFixed(1)}</td>
                                <td className="py-2 px-2 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${ip.lulusKKM ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                    {ip.predikat}
                                  </span>
                                </td>
                              </>
                            ) : (
                              <>
                                <td colSpan={4} className="py-2 px-2 text-center text-muted-foreground italic">
                                  Belum ada nilai
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // IPK Ranking
  const renderIPK = () => {
    const data = siswas.map(s => {
      const ipkResult = hitungIPK(s.id, tahaps, materis, nilaiHarianAll, nilaiUlanganAll, jamTambahanAll);
      return { 
        ...s, 
        ipk: ipkResult?.ipk ?? 0, 
        hasIPK: !!ipkResult
      };
    }).filter(s => s.hasIPK).sort((a, b) => b.ipk - a.ipk);

    if (data.length === 0) 
      return <p className="text-center text-muted-foreground py-8">Belum ada data IPK</p>;

    return (
      <div className="space-y-2">
        {data.map((s, idx) => (
          <div key={s.id} className="app-card flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx < 3 ? 'bg-secondary/20 text-secondary' : 'bg-muted text-muted-foreground'}`}>
                {idx + 1}
              </span>
              <div>
                <div className="font-semibold text-foreground text-sm">{s.nama_lengkap}</div>
                <div className="text-xs text-muted-foreground">{s.no_induk}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold text-foreground">{s.ipk.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{getBobot(s.ipk * 25).predikat}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={() => router.push('/admin')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Laporan</h1>
        </div>
        <div className="app-content flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="app-topbar">
        <button onClick={() => router.push('/admin')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1>Laporan</h1>
      </div>
      <div className="app-content p-4 space-y-4">
        {/* Tahun Akademik Selector */}
        <div className="app-card">
          <Label className="text-sm font-medium mb-2 block">Tahun Akademik</Label>
          <Select value={selectedTahunAkademik} onValueChange={setSelectedTahunAkademik}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Pilih Tahun Akademik" />
            </SelectTrigger>
            <SelectContent>
              {tahunAkademik.map(ta => (
                <SelectItem key={ta.id} value={ta.id}>
                  {ta.tahun} {ta.status === 'aktif' && '(Aktif)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTahunAkademik && (
          <Tabs defaultValue="siswa" className="w-full">
            <TabsList className="w-full rounded-xl mb-4 bg-muted">
              <TabsTrigger value="siswa" className="flex-1 rounded-lg text-xs">Per Siswa</TabsTrigger>
              <TabsTrigger value="kelompok" className="flex-1 rounded-lg text-xs">Per Kelompok</TabsTrigger>
              <TabsTrigger value="ipk" className="flex-1 rounded-lg text-xs">Ranking IPK</TabsTrigger>
            </TabsList>

          <TabsContent value="siswa" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Pilih Siswa</Label>
              <Select value={selSiswa} onValueChange={setSelSiswa}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih Siswa" /></SelectTrigger>
                <SelectContent>
                  {siswas.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama_lengkap} ({s.no_induk})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderPerSiswa()}
          </TabsContent>

          <TabsContent value="kelompok" className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Pilih Kelompok</Label>
              <Select value={selKelompok} onValueChange={setSelKelompok}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Pilih Kelompok" /></SelectTrigger>
                <SelectContent>
                  {kelompoks.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama_kelompok}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {renderPerKelompok()}
          </TabsContent>

          <TabsContent value="ipk">
            {renderIPK()}
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
