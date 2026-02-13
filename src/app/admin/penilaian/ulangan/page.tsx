'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, BookOpen, Users, Award, Loader2 } from 'lucide-react';
import { masterDataService } from '@/services/masterDataService';
import type { Tahap, Materi, Kelompok, Siswa, NilaiUlangan, TahunAkademik } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface NilaiInput {
  siswa_id: string;
  nilai: number;
  keterangan: string;
}

export default function NilaiUlangan() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [existingNilai, setExistingNilai] = useState<NilaiUlangan[]>([]);

  const [filterTahapId, setFilterTahapId] = useState('');
  const [filterMateriId, setFilterMateriId] = useState('');
  const [filterKelompokId, setFilterKelompokId] = useState('');
  const [nilaiInputs, setNilaiInputs] = useState<Record<string, NilaiInput>>({});
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadInitialData();
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

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      const [tahapData, materiData, kelompokData, enrollmentRes] = await Promise.all([
        masterDataService.getAllTahap(),
        masterDataService.getAllMateri(),
        masterDataService.getAllKelompok(),
        fetch(`/api/enrollment?tahun_akademik_id=${selectedTahunAkademik}`)
      ]);

      // Filter tahap by tahun akademik
      const filteredTahap = tahapData.filter(t => t.tahun_akademik_id === selectedTahunAkademik);

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
  };

  const selectedTahap = useMemo(() => 
    tahaps.find(t => t.id === filterTahapId),
    [tahaps, filterTahapId]
  );

  const selectedMateri = useMemo(() =>
    materis.find(m => m.id === filterMateriId),
    [materis, filterMateriId]
  );

  const selectedKelompok = useMemo(() =>
    kelompoks.find(k => k.id === filterKelompokId),
    [kelompoks, filterKelompokId]
  );

  const filteredSiswas = useMemo(() => {
    if (!filterKelompokId) return [];
    // Show all enrolled siswa (kelompok filter not available without enrollment data)
    return siswas.sort((a, b) => a.no_induk.localeCompare(b.no_induk));
  }, [siswas, filterKelompokId]);

  const handleShowForm = async () => {
    if (!filterTahapId || !filterMateriId || !filterKelompokId) {
      toast({
        title: 'Error',
        description: 'Pilih tahap, materi, dan kelompok terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      const nilaiData = await masterDataService.getNilaiUlanganByTahapMateriKelompok(
        filterTahapId,
        filterMateriId,
        filterKelompokId
      );
      setExistingNilai(nilaiData);

      const inputs: Record<string, NilaiInput> = {};
      for (const siswa of filteredSiswas) {
        const existing = nilaiData.find(n => n.siswa_id === siswa.id);
        inputs[siswa.id] = {
          siswa_id: siswa.id,
          nilai: existing?.nilai || 0,
          keterangan: existing?.keterangan || ''
        };
      }
      setNilaiInputs(inputs);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading nilai:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat nilai',
        variant: 'destructive',
      });
    }
  };

  const handleNilaiChange = (siswaId: string, field: 'nilai' | 'keterangan', value: string | number) => {
    setNilaiInputs(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!filterTahapId || !filterMateriId || !filterKelompokId) return;

    const invalidNilai = Object.values(nilaiInputs).find(n => n.nilai < 0 || n.nilai > 100);
    if (invalidNilai) {
      toast({
        title: 'Error',
        description: 'Nilai harus antara 0-100',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const today = new Date().toISOString().split('T')[0];

      for (const input of Object.values(nilaiInputs)) {
        const existing = existingNilai.find(n => n.siswa_id === input.siswa_id);

        const nilaiData = {
          siswa_id: input.siswa_id,
          tahap_id: filterTahapId,
          materi_id: filterMateriId,
          kelompok_id: filterKelompokId,
          tahun_akademik_id: selectedTahunAkademik,
          nilai: input.nilai,
          keterangan: input.keterangan,
          tanggal_input: today,
          created_at: existing?.created_at || now
        };

        if (existing) {
          await masterDataService.updateNilaiUlangan(existing.id, nilaiData);
        } else {
          await masterDataService.createNilaiUlangan(nilaiData);
        }
      }

      // Auto-trigger Jam Tambahan berdasarkan IP (rata² harian + ulangan)
      let jamTambahanCount = 0;
      
      // Helper: Hitung durasi jadwal dalam menit
      const calculateJadwalDuration = (jamMulai: string, jamSelesai: string): number => {
        const [startHour, startMin] = jamMulai.split(':').map(Number);
        const [endHour, endMin] = jamSelesai.split(':').map(Number);
        const startInMinutes = (startHour * 60) + startMin;
        const endInMinutes = (endHour * 60) + endMin;
        return endInMinutes - startInMinutes;
      };

      // Get jadwal untuk tahap dan materi ini
      const allJadwals = await masterDataService.getAllJadwal();
      const relevantJadwals = allJadwals.filter(j => 
        j.tahap_id === filterTahapId && 
        j.materi_id === filterMateriId
      );

      // Hitung total durasi dari semua jadwal materi ini
      let totalDurasiMenit = 0;
      if (relevantJadwals.length > 0) {
        // Sum all jadwal durations for this materi
        totalDurasiMenit = relevantJadwals.reduce((sum, jadwal) => {
          return sum + calculateJadwalDuration(jadwal.jam_mulai, jadwal.jam_selesai);
        }, 0);
        
        // Average duration per jadwal session
        totalDurasiMenit = Math.round(totalDurasiMenit / relevantJadwals.length);
      }

      for (const input of Object.values(nilaiInputs)) {
        // Hitung rata-rata nilai harian siswa untuk materi ini
        const nilaiHarianList = await masterDataService.getNilaiHarianBySiswaMateri(
          input.siswa_id, 
          filterMateriId
        );
        
        if (nilaiHarianList.length === 0) {
          // Tidak ada nilai harian, skip
          continue;
        }

        // Hitung rata-rata nilai harian
        const totalNilaiHarian = nilaiHarianList.reduce((sum, n) => sum + n.nilai, 0);
        const rataHarian = totalNilaiHarian / nilaiHarianList.length;

        // Hitung IP: (rata_harian × 60%) + (nilai_ulangan × 40%)
        const nilaiUlangan = input.nilai;
        const ip = (rataHarian * 0.6) + (nilaiUlangan * 0.4);

        // Jika IP < 40, trigger jam tambahan
        if (ip > 0 && ip < 40) {
          // Check apakah sudah ada jam tambahan pending
          const existingJT = await masterDataService.getAllJamTambahan();
          const alreadyExists = existingJT.some(jt => 
            jt.siswa_id === input.siswa_id && 
            jt.materi_id === filterMateriId &&
            jt.tahap_id === filterTahapId &&
            jt.status === 'pending'
          );

          if (!alreadyExists) {
            // Create jam tambahan entry
            await masterDataService.createJamTambahan({
              siswa_id: input.siswa_id,
              tahap_id: filterTahapId,
              materi_id: filterMateriId,
              tahun_akademik_id: selectedTahunAkademik,
              nilai_awal: Math.round(ip * 100) / 100, // IP sebagai nilai_awal
              jumlah_menit: totalDurasiMenit, // Auto-set dari durasi jadwal
              status: 'pending',
              keterangan: `Auto-generated: IP ${Math.round(ip * 100) / 100} < 40 (Rata² Harian: ${Math.round(rataHarian * 100) / 100}, Ulangan: ${nilaiUlangan}). Durasi: ${totalDurasiMenit} menit`,
              created_at: now
            });
            jamTambahanCount++;
          }
        }
      }

      const message = jamTambahanCount > 0 
        ? `Nilai ulangan berhasil disimpan. ${jamTambahanCount} siswa memerlukan jam tambahan (IP < 40).`
        : 'Nilai ulangan (UAM) berhasil disimpan';

      toast({
        title: 'Berhasil',
        description: message,
      });
      await handleShowForm();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan nilai',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setShowForm(false);
    setNilaiInputs({});
  };


  if (loading) {
    return (
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/penilaian')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Nilai Ulangan (UAM)</h1>
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
        <button onClick={() => router.push('/admin/penilaian')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1>Nilai Ulangan (UAM)</h1>
        <span className="ml-auto text-xs opacity-70">Ujian Akhir Materi</span>
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
          <>
            {/* Filter Section */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tahap">Tahap</Label>
                <Select value={filterTahapId} onValueChange={(v) => {
                  setFilterTahapId(v);
                  setShowForm(false);
                }}>
                  <SelectTrigger id="tahap" className="rounded-xl">
                    <SelectValue placeholder="Pilih tahap..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tahaps.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{t.nama_tahap}</span>
                            <span className="text-xs text-muted-foreground">
                              {t.tanggal_mulai} s/d {t.tanggal_selesai}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

          <div className="space-y-2">
            <Label htmlFor="materi">Materi</Label>
            <Select 
              value={filterMateriId} 
              onValueChange={(v) => {
                setFilterMateriId(v);
                setShowForm(false);
              }} 
              disabled={!filterTahapId}
            >
              <SelectTrigger id="materi" className="rounded-xl">
                <SelectValue placeholder="Pilih materi..." />
              </SelectTrigger>
              <SelectContent>
                {materis.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{m.nama_materi}</span>
                      <Badge variant="outline" className="text-xs">SKT: {m.skt}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!filterTahapId && (
              <p className="text-xs text-muted-foreground">Pilih tahap terlebih dahulu</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kelompok">Kelompok</Label>
            <Select 
              value={filterKelompokId} 
              onValueChange={(v) => {
                setFilterKelompokId(v);
                setShowForm(false);
              }} 
              disabled={!filterMateriId}
            >
              <SelectTrigger id="kelompok" className="rounded-xl">
                <SelectValue placeholder="Pilih kelompok..." />
              </SelectTrigger>
              <SelectContent>
                {kelompoks.map(k => (
                  <SelectItem key={k.id} value={k.id}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {k.nama_kelompok}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!filterMateriId && (
              <p className="text-xs text-muted-foreground">Pilih materi terlebih dahulu</p>
            )}
          </div>

          {filterTahapId && filterMateriId && filterKelompokId && !showForm && (
            <Button onClick={handleShowForm} className="w-full rounded-xl">
              <Award className="h-4 w-4 mr-2" />
              Tampilkan Form Input
            </Button>
          )}
        </div>

        {/* Info Selected */}
        {showForm && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4 text-primary" />
              <span>Info Ulangan (UAM)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Tahap:</span>
                <p className="font-medium">{selectedTahap?.nama_tahap}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Materi:</span>
                <p className="font-medium">{selectedMateri?.nama_materi}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kelompok:</span>
                <p className="font-medium">{selectedKelompok?.nama_kelompok}</p>
              </div>
              <div>
                <span className="text-muted-foreground">SKT:</span>
                <p className="font-medium">{selectedMateri?.skt}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Input Nilai */}
        {showForm && filteredSiswas.length > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-semibold">Daftar Siswa</h3>
                <Badge variant="outline">{filteredSiswas.length} siswa</Badge>
              </div>

              <div className="space-y-2">
                {filteredSiswas.map((siswa, idx) => {
                  const input = nilaiInputs[siswa.id];
                  if (!input) return null;

                  return (
                    <div key={siswa.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{siswa.nama_lengkap}</p>
                          <p className="text-xs text-muted-foreground font-mono">{siswa.no_induk}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Nilai</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={input.nilai}
                            onChange={(e) => handleNilaiChange(siswa.id, 'nilai', Number(e.target.value))}
                            className="text-center font-semibold rounded-xl"
                            placeholder="0-100"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Keterangan</Label>
                          <Input
                            type="text"
                            value={input.keterangan}
                            onChange={(e) => handleNilaiChange(siswa.id, 'keterangan', e.target.value)}
                            className="rounded-xl"
                            placeholder="Catatan..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleReset} 
                variant="outline" 
                className="flex-1 rounded-xl"
                disabled={saving}
              >
                Batal
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-1 rounded-xl"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Nilai
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {/* Empty States */}
        {!filterTahapId && (
          <div className="py-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium mb-1">Input Nilai Ulangan (UAM)</p>
            <p className="text-sm text-muted-foreground">
              Pilih tahap, materi, dan kelompok untuk memulai
            </p>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
