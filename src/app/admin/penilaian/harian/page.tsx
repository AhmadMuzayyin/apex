'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Calendar, Users, BookOpen, Loader2, Award, CalendarDays, QrCode } from 'lucide-react';
import { masterDataService } from '@/services/masterDataService';
import type { Jadwal, Siswa, NilaiHarian, Materi, Kelompok, Tahap, Absensi } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface NilaiInput {
  siswa_id: string;
  pertemuan_ke: number;
  nilai: number;
  keterangan: string;
}

export default function NilaiHarian() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingNilai, setLoadingNilai] = useState(false);

  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [todayJadwals, setTodayJadwals] = useState<Jadwal[]>([]);
  const [existingNilai, setExistingNilai] = useState<NilaiHarian[]>([]);
  const [absensis, setAbsensis] = useState<Absensi[]>([]);

  // State untuk Input Otomatis
  const [filterKelompokId, setFilterKelompokId] = useState('');
  const [selectedJadwalId, setSelectedJadwalId] = useState('');
  const [nilaiInputs, setNilaiInputs] = useState<Record<string, NilaiInput>>({});
  
  // URL params dari scan page
  const fromScan = searchParams.get('from') === 'scan';
  const urlJadwalId = searchParams.get('jadwal_id');
  
  const today = new Date().toISOString().split('T')[0];
  const todayDate = new Date();
  const hariName = HARI_INDO[todayDate.getDay()];
  
  // State untuk Input Manual
  const [manualTanggal, setManualTanggal] = useState(today);
  const [manualTahapId, setManualTahapId] = useState('');
  const [manualKelompokId, setManualKelompokId] = useState('');
  const [manualMateriId, setManualMateriId] = useState('');
  const [manualNilaiInputs, setManualNilaiInputs] = useState<Record<string, NilaiInput>>({});
  const loadInitialData = useCallback(async () => {
    try {
      const [kelompokData, siswaData, materiData, tahapData, jadwalData, absensiData] = await Promise.all([
        masterDataService.getAllKelompok(),
        masterDataService.getAllSiswa(),
        masterDataService.getAllMateri(),
        masterDataService.getAllTahap(),
        masterDataService.getJadwalByTanggal(today),
        masterDataService.getAllAbsensi()
      ]);
      setKelompoks(kelompokData);
      setSiswas(siswaData);
      setMateris(materiData);
      setTahaps(tahapData);
      setTodayJadwals(jadwalData);
      setAbsensis(absensiData);

      // Auto-select jadwal dari URL params (dari scan page)
      if (urlJadwalId && jadwalData.some(j => j.id === urlJadwalId)) {
        const jadwal = jadwalData.find(j => j.id === urlJadwalId);
        if (jadwal) {
          setFilterKelompokId(jadwal.kelompok_id);
          setSelectedJadwalId(urlJadwalId);
        }
      }
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
  }, [today, toast, urlJadwalId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Auto-select jadwal jika hanya 1
  useEffect(() => {
    if (filterKelompokId) {
      const kelompokJadwals = todayJadwals.filter(j => j.kelompok_id === filterKelompokId);
      if (kelompokJadwals.length === 1) {
        setSelectedJadwalId(kelompokJadwals[0].id);
      } else if (kelompokJadwals.length === 0) {
        setSelectedJadwalId('');
        setNilaiInputs({});
      }
    } else {
      setSelectedJadwalId('');
      setNilaiInputs({});
    }
  }, [filterKelompokId, todayJadwals]);

  const loadNilaiForJadwal = useCallback(async (jadwalId: string) => {
    setLoadingNilai(true);
    try {
      const nilaiData = await masterDataService.getNilaiHarianByJadwal(jadwalId);
      setExistingNilai(nilaiData);

      const jadwal = todayJadwals.find(j => j.id === jadwalId);
      if (!jadwal) return;

      let kelompokSiswas = siswas
        .filter(s => s.kelompok_id === jadwal.kelompok_id)
        .sort((a, b) => a.no_induk.localeCompare(b.no_induk));

      // Jika dari scan page, filter hanya siswa yang hadir
      if (fromScan) {
        const jadwalAbsensis = absensis.filter(a => a.jadwal_id === jadwalId && a.status === 'hadir');
        const hadirSiswaIds = jadwalAbsensis.map(a => a.siswa_id);
        kelompokSiswas = kelompokSiswas.filter(s => hadirSiswaIds.includes(s.id));
      }

      const inputs: Record<string, NilaiInput> = {};
      for (const siswa of kelompokSiswas) {
        const existing = nilaiData.find(n => n.siswa_id === siswa.id);
        
        // SELALU hitung pertemuan_ke dari riwayat, bukan dari existing
        // Untuk menghindari duplikasi, filter riwayat EXCLUDE hari ini (tanggal jadwal)
        const riwayat = await masterDataService.getNilaiHarianBySiswaMateri(siswa.id, jadwal.materi_id);
        
        // Filter riwayat: exclude nilai hari ini (berdasarkan jadwal_id yang sama)
        const riwayatSebelumnya = riwayat.filter(r => r.jadwal_id !== jadwalId);
        const pertemuanKe = riwayatSebelumnya.length + 1;

        inputs[siswa.id] = {
          siswa_id: siswa.id,
          pertemuan_ke: pertemuanKe,
          nilai: existing?.nilai || 0,
          keterangan: existing?.keterangan || ''
        };
      }
      setNilaiInputs(inputs);
    } catch (error) {
      console.error('Error loading nilai:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat nilai',
        variant: 'destructive',
      });
    } finally {
      setLoadingNilai(false);
    }
  }, [todayJadwals, siswas, absensis, fromScan, toast]);

  useEffect(() => {
    if (selectedJadwalId) {
      loadNilaiForJadwal(selectedJadwalId);
    }
  }, [selectedJadwalId, loadNilaiForJadwal]);

  const selectedJadwal = todayJadwals.find(j => j.id === selectedJadwalId);
  const selectedMateri = materis.find(m => m.id === selectedJadwal?.materi_id);
  const selectedKelompok = kelompoks.find(k => k.id === selectedJadwal?.kelompok_id);
  const selectedTahap = tahaps.find(t => t.id === selectedJadwal?.tahap_id);
  
  const filteredSiswas = siswas
    .filter(s => s.kelompok_id === filterKelompokId)
    .sort((a, b) => a.no_induk.localeCompare(b.no_induk));
  
  const kelompokJadwals = todayJadwals.filter(j => j.kelompok_id === filterKelompokId);

  // Get hadir count dari absensi
  const hadirCount = selectedJadwalId 
    ? absensis.filter(a => a.jadwal_id === selectedJadwalId && a.status === 'hadir').length 
    : 0;

  const handleNilaiChange = (siswaId: string, field: 'nilai' | 'keterangan', value: string | number) => {
    // Validasi: nilai > 0 hanya jika siswa hadir
    if (field === 'nilai' && typeof value === 'number' && value > 0) {
      const absensiSiswa = absensis.find(a => 
        a.jadwal_id === selectedJadwalId && 
        a.siswa_id === siswaId
      );
      
      if (!absensiSiswa || absensiSiswa.status !== 'hadir') {
        toast({
          title: 'Tidak dapat input nilai',
          description: 'Nilai > 0 hanya dapat diinput untuk siswa yang hadir',
          variant: 'destructive',
        });
        return;
      }
    }

    setNilaiInputs(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value
      }
    }));
  };

  const handleManualNilaiChange = (siswaId: string, field: 'nilai' | 'keterangan', value: string | number) => {
    // Validasi: nilai > 0 hanya jika siswa hadir di tanggal yang dipilih
    if (field === 'nilai' && typeof value === 'number' && value > 0 && manualTanggal) {
      const absensiSiswa = absensis.find(a => {
        const absensiDate = new Date(a.created_at).toISOString().split('T')[0];
        return a.siswa_id === siswaId && 
               absensiDate === manualTanggal &&
               a.status === 'hadir';
      });
      
      if (!absensiSiswa) {
        toast({
          title: 'Tidak dapat input nilai',
          description: 'Nilai > 0 hanya dapat diinput untuk siswa yang hadir di tanggal tersebut',
          variant: 'destructive',
        });
        return;
      }
    }

    setManualNilaiInputs(prev => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        [field]: value
      }
    }));
  };

  // Load nilai untuk input manual
  const loadManualNilai = useCallback(async () => {
    if (!manualKelompokId || !manualMateriId || !manualTanggal || !manualTahapId) return;

    setLoadingNilai(true);
    try {
      const kelompokSiswas = siswas
        .filter(s => s.kelompok_id === manualKelompokId)
        .sort((a, b) => a.no_induk.localeCompare(b.no_induk));

      const inputs: Record<string, NilaiInput> = {};
      
      for (const siswa of kelompokSiswas) {
        // Hitung pertemuan_ke berdasarkan riwayat
        const riwayat = await masterDataService.getNilaiHarianBySiswaMateri(siswa.id, manualMateriId);
        // Filter: hanya riwayat SEBELUM tanggal yang dipilih
        const riwayatSebelumnya = riwayat.filter(r => r.tanggal_input < manualTanggal);
        const pertemuanKe = riwayatSebelumnya.length + 1;

        // Cek apakah sudah ada nilai di tanggal ini
        const existing = riwayat.find(r => 
          r.tanggal_input === manualTanggal && 
          r.materi_id === manualMateriId
        );

        inputs[siswa.id] = {
          siswa_id: siswa.id,
          pertemuan_ke: existing?.pertemuan_ke || pertemuanKe,
          nilai: existing?.nilai || 0,
          keterangan: existing?.keterangan || ''
        };
      }

      setManualNilaiInputs(inputs);
    } catch (error) {
      console.error('Error loading manual nilai:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat nilai',
        variant: 'destructive',
      });
    } finally {
      setLoadingNilai(false);
    }
  }, [manualKelompokId, manualMateriId, manualTanggal, manualTahapId, siswas, toast]);

  useEffect(() => {
    if (manualKelompokId && manualMateriId && manualTanggal && manualTahapId) {
      loadManualNilai();
    }
  }, [loadManualNilai, manualKelompokId, manualMateriId, manualTanggal, manualTahapId]);

  const handleSave = async () => {
    if (!selectedJadwal) return;

    // Validasi range nilai
    const invalidNilai = Object.values(nilaiInputs).find(n => n.nilai < 0 || n.nilai > 100);
    if (invalidNilai) {
      toast({
        title: 'Error',
        description: 'Nilai harus antara 0-100',
        variant: 'destructive',
      });
      return;
    }

    // Validasi: nilai > 0 hanya untuk siswa yang hadir
    for (const input of Object.values(nilaiInputs)) {
      if (input.nilai > 0) {
        const absensiSiswa = absensis.find(a => 
          a.jadwal_id === selectedJadwalId && 
          a.siswa_id === input.siswa_id
        );
        
        if (!absensiSiswa || absensiSiswa.status !== 'hadir') {
          const siswa = siswas.find(s => s.id === input.siswa_id);
          toast({
            title: 'Validasi gagal',
            description: `${siswa?.nama_lengkap} tidak hadir. Nilai harus 0.`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      for (const input of Object.values(nilaiInputs)) {
        const existing = existingNilai.find(n => n.siswa_id === input.siswa_id);

        const nilaiData = {
          jadwal_id: selectedJadwalId,
          siswa_id: input.siswa_id,
          tahap_id: selectedJadwal.tahap_id,
          materi_id: selectedJadwal.materi_id,
          kelompok_id: selectedJadwal.kelompok_id,
          pertemuan_ke: input.pertemuan_ke,
          nilai: input.nilai,
          keterangan: input.keterangan,
          tanggal_input: today,
          created_at: existing?.created_at || now
        };

        if (existing) {
          await masterDataService.updateNilaiHarian(existing.id, nilaiData);
        } else {
          await masterDataService.createNilaiHarian(nilaiData);
        }
      }

      toast({
        title: 'Berhasil',
        description: 'Nilai harian berhasil disimpan',
      });
      await loadNilaiForJadwal(selectedJadwalId);

      // Jika dari scan, redirect kembali ke scan page setelah 1 detik
      if (fromScan) {
        setTimeout(() => {
          router.push('/admin/absensi/scan');
        }, 1500);
      }
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

  const handleSaveManual = async () => {
    if (!manualKelompokId || !manualMateriId || !manualTahapId) return;

    // Validasi range nilai
    const invalidNilai = Object.values(manualNilaiInputs).find(n => n.nilai < 0 || n.nilai > 100);
    if (invalidNilai) {
      toast({
        title: 'Error',
        description: 'Nilai harus antara 0-100',
        variant: 'destructive',
      });
      return;
    }

    // Validasi: nilai > 0 hanya untuk siswa yang punya absensi hadir di tanggal yang dipilih
    for (const input of Object.values(manualNilaiInputs)) {
      if (input.nilai > 0) {
        // Cari absensi siswa di tanggal yang dipilih dengan materi yang dipilih
        const absensiSiswa = absensis.find(a => {
          const absensiDate = new Date(a.created_at).toISOString().split('T')[0];
          return a.siswa_id === input.siswa_id && 
                 absensiDate === manualTanggal &&
                 a.status === 'hadir';
        });
        
        if (!absensiSiswa) {
          const siswa = siswas.find(s => s.id === input.siswa_id);
          toast({
            title: 'Validasi gagal',
            description: `${siswa?.nama_lengkap} tidak ada absensi hadir di tanggal ${manualTanggal}. Nilai harus 0.`,
            variant: 'destructive',
          });
          return;
        }
      }
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();

      for (const input of Object.values(manualNilaiInputs)) {
        // Cek apakah sudah ada nilai di tanggal & materi ini
        const riwayat = await masterDataService.getNilaiHarianBySiswaMateri(input.siswa_id, manualMateriId);
        const existing = riwayat.find(r => 
          r.tanggal_input === manualTanggal && 
          r.materi_id === manualMateriId
        );

        const nilaiData = {
          jadwal_id: '', // Manual input tidak punya jadwal_id
          siswa_id: input.siswa_id,
          tahap_id: manualTahapId,
          materi_id: manualMateriId,
          kelompok_id: manualKelompokId,
          pertemuan_ke: input.pertemuan_ke,
          nilai: input.nilai,
          keterangan: input.keterangan,
          tanggal_input: manualTanggal,
          created_at: existing?.created_at || now
        };

        if (existing) {
          await masterDataService.updateNilaiHarian(existing.id, nilaiData);
        } else {
          await masterDataService.createNilaiHarian(nilaiData);
        }
      }

      toast({
        title: 'Berhasil',
        description: 'Nilai harian berhasil disimpan',
      });
      await loadManualNilai();
    } catch (error) {
      console.error('Error saving manual:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan nilai',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Render Input Otomatis Tab
  const renderInputOtomatis = () => (
    <>
      {/* Alert jika dari scan */}
      {fromScan && selectedJadwal && (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <QrCode className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Input Nilai dari QR Scan</strong>
            <br />
            Menampilkan hanya siswa yang hadir ({hadirCount} siswa).
            Jadwal: <strong>{selectedMateri?.nama_materi}</strong> - {selectedJadwal.jam_mulai} s/d {selectedJadwal.jam_selesai}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Kelompok */}
      <div className="space-y-2">
        <Label htmlFor="kelompok">Pilih Kelompok</Label>
        <Select value={filterKelompokId} onValueChange={setFilterKelompokId} disabled={fromScan}>
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
        {filterKelompokId && kelompokJadwals.length === 0 && (
          <p className="text-xs text-destructive">
            Tidak ada jadwal aktif hari ini untuk kelompok ini
          </p>
        )}
        {filterKelompokId && kelompokJadwals.length > 0 && !fromScan && (
          <p className="text-xs text-muted-foreground">
            {kelompokJadwals.length} jadwal aktif hari ini
          </p>
        )}
      </div>

      {/* Multiple Jadwal Selection */}
      {kelompokJadwals.length > 1 && !fromScan && (
        <div className="space-y-2">
          <Label htmlFor="jadwal">Pilih Jadwal</Label>
          <Select value={selectedJadwalId} onValueChange={setSelectedJadwalId}>
            <SelectTrigger id="jadwal" className="rounded-xl">
              <SelectValue placeholder="Pilih jadwal..." />
            </SelectTrigger>
            <SelectContent>
              {kelompokJadwals.map(j => {
                const materi = materis.find(m => m.id === j.materi_id);
                return (
                  <SelectItem key={j.id} value={j.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{materi?.nama_materi}</span>
                      <span className="text-muted-foreground">• {j.jam_mulai}-{j.jam_selesai}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info Jadwal Aktif */}
      {selectedJadwal && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Award className="h-4 w-4 text-primary" />
            <span>Jadwal Aktif</span>
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
              <span className="text-muted-foreground">Jam:</span>
              <p className="font-medium">{selectedJadwal.jam_mulai} - {selectedJadwal.jam_selesai}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Input Nilai */}
      {selectedJadwalId && filteredSiswas.length > 0 && (
        <>
          {loadingNilai ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <h3 className="font-semibold">Daftar Siswa</h3>
                <Badge variant="outline">{filteredSiswas.length} siswa</Badge>
              </div>

              <div className="space-y-2">
                {filteredSiswas.map((siswa, idx) => {
                  const input = nilaiInputs[siswa.id];
                  if (!input) return null;

                  // Check absensi status
                  const absensiSiswa = absensis.find(a => 
                    a.jadwal_id === selectedJadwalId && 
                    a.siswa_id === siswa.id
                  );
                  const isHadir = absensiSiswa?.status === 'hadir';
                  const absensiStatus = absensiSiswa?.status || 'belum absen';

                  return (
                    <div key={siswa.id} className={`border rounded-lg p-3 space-y-2 ${!isHadir ? 'bg-muted/30 opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{siswa.nama_lengkap}</p>
                            <p className="text-xs text-muted-foreground font-mono">{siswa.no_induk}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            Pert. {input.pertemuan_ke}
                          </Badge>
                          {!isHadir && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {absensiStatus}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {!isHadir && (
                        <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                          ⚠️ Siswa tidak hadir. Nilai harus 0.
                        </div>
                      )}
                      
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
                            disabled={!isHadir}
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
          )}

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => {
                setFilterKelompokId('');
                setSelectedJadwalId('');
              }} 
              variant="outline" 
              className="flex-1 rounded-xl"
              disabled={loadingNilai}
            >
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || loadingNilai || Object.keys(nilaiInputs).length === 0} 
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
                  {fromScan ? 'Simpan & Kembali ke Scan' : 'Simpan Nilai'}
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {/* Empty States */}
      {!filterKelompokId && (
        <div className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium mb-1">Input Nilai Harian</p>
          <p className="text-sm text-muted-foreground">
            Pilih kelompok untuk melihat jadwal aktif hari ini
          </p>
        </div>
      )}

      {filterKelompokId && kelompokJadwals.length === 0 && (
        <div className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="font-medium mb-1">Tidak Ada Jadwal</p>
          <p className="text-sm text-muted-foreground">
            Kelompok ini tidak memiliki jadwal aktif hari ini
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {hariName}, {today}
          </p>
        </div>
      )}
    </>
  );

  // Render Input Manual Tab
  const renderInputManual = () => {
    const manualFilteredSiswas = siswas
      .filter(s => s.kelompok_id === manualKelompokId)
      .sort((a, b) => a.no_induk.localeCompare(b.no_induk));

    const selectedManualMateri = materis.find(m => m.id === manualMateriId);
    const selectedManualKelompok = kelompoks.find(k => k.id === manualKelompokId);
    const selectedManualTahap = tahaps.find(t => t.id === manualTahapId);

    return (
      <>
        {/* Filter Manual */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="manual-tanggal">Tanggal Input</Label>
            <Input
              id="manual-tanggal"
              type="date"
              value={manualTanggal}
              onChange={(e) => setManualTanggal(e.target.value)}
              className="rounded-xl"
              max={today}
            />
            <p className="text-xs text-muted-foreground">
              Pilih tanggal untuk input nilai yang terlewati
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-kelompok">Kelompok</Label>
            <Select value={manualKelompokId} onValueChange={setManualKelompokId}>
              <SelectTrigger id="manual-kelompok" className="rounded-xl">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-tahap">Tahap</Label>
            <Select value={manualTahapId} onValueChange={setManualTahapId}>
              <SelectTrigger id="manual-tahap" className="rounded-xl">
                <SelectValue placeholder="Pilih tahap..." />
              </SelectTrigger>
              <SelectContent>
                {tahaps.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      {t.nama_tahap}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-materi">Materi</Label>
            <Select value={manualMateriId} onValueChange={setManualMateriId}>
              <SelectTrigger id="manual-materi" className="rounded-xl">
                <SelectValue placeholder="Pilih materi..." />
              </SelectTrigger>
              <SelectContent>
                {materis.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{m.nama_materi}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Info Manual Input */}
        {manualKelompokId && manualMateriId && manualTahapId && (
          <div className="bg-secondary/30 border border-secondary/50 rounded-xl p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-secondary-foreground" />
              <span>Info Input Manual</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Tanggal:</span>
                <p className="font-medium">{new Date(manualTanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Tahap:</span>
                <p className="font-medium">{selectedManualTahap?.nama_tahap}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Materi:</span>
                <p className="font-medium">{selectedManualMateri?.nama_materi}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kelompok:</span>
                <p className="font-medium">{selectedManualKelompok?.nama_kelompok}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Input Nilai Manual */}
        {manualKelompokId && manualMateriId && manualTahapId && manualFilteredSiswas.length > 0 && (
          <>
            {loadingNilai ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-semibold">Daftar Siswa</h3>
                  <Badge variant="outline">{manualFilteredSiswas.length} siswa</Badge>
                </div>

                <div className="space-y-2">
                  {manualFilteredSiswas.map((siswa, idx) => {
                    const input = manualNilaiInputs[siswa.id];
                    if (!input) return null;

                    // Check absensi status untuk tanggal yang dipilih
                    const absensiSiswa = absensis.find(a => {
                      const absensiDate = new Date(a.created_at).toISOString().split('T')[0];
                      return a.siswa_id === siswa.id && 
                             absensiDate === manualTanggal;
                    });
                    const isHadir = absensiSiswa?.status === 'hadir';
                    const absensiStatus = absensiSiswa?.status || 'belum absen';

                    return (
                      <div key={siswa.id} className={`border rounded-lg p-3 space-y-2 ${!isHadir ? 'bg-muted/30 opacity-60' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{siswa.nama_lengkap}</p>
                              <p className="text-xs text-muted-foreground font-mono">{siswa.no_induk}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              Pert. {input.pertemuan_ke}
                            </Badge>
                            {!isHadir && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {absensiStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {!isHadir && (
                          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-2">
                            ⚠️ Siswa tidak hadir di tanggal {manualTanggal}. Nilai harus 0.
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Nilai</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={input.nilai}
                              onChange={(e) => handleManualNilaiChange(siswa.id, 'nilai', Number(e.target.value))}
                              className="text-center font-semibold rounded-xl"
                              placeholder="0-100"
                              disabled={!isHadir}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Keterangan</Label>
                            <Input
                              type="text"
                              value={input.keterangan}
                              onChange={(e) => handleManualNilaiChange(siswa.id, 'keterangan', e.target.value)}
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
            )}

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => {
                  setManualTahapId('');
                  setManualKelompokId('');
                  setManualMateriId('');
                  setManualNilaiInputs({});
                }} 
                variant="outline" 
                className="flex-1 rounded-xl"
                disabled={loadingNilai}
              >
                Reset
              </Button>
              <Button 
                onClick={handleSaveManual} 
                disabled={saving || loadingNilai || Object.keys(manualNilaiInputs).length === 0} 
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

        {/* Empty State */}
        {(!manualKelompokId || !manualMateriId || !manualTahapId) && (
          <div className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium mb-1">Input Manual Nilai Harian</p>
            <p className="text-sm text-muted-foreground">
              Pilih tanggal, kelompok, tahap, dan materi untuk input nilai yang terlewati
            </p>
          </div>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/penilaian')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Nilai Harian</h1>
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
        <h1>Nilai Harian</h1>
        <span className="ml-auto text-sm opacity-80">
          {hariName}, {today}
        </span>
      </div>

      <div className="app-content p-4">
        <Tabs defaultValue="otomatis" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="otomatis" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Input Otomatis
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Input Manual
            </TabsTrigger>
          </TabsList>

          {/* TAB: INPUT OTOMATIS (Existing Logic) */}
          <TabsContent value="otomatis" className="space-y-4 mt-0">{renderInputOtomatis()}</TabsContent>

          {/* TAB: INPUT MANUAL */}
          <TabsContent value="manual" className="space-y-4 mt-0">{renderInputManual()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
