'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, Users, AlertCircle, Loader2, QrCode as QrIcon, RotateCcw } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { masterDataService } from '@/services/masterDataService';
import { formatTime, formatDateIndo } from '@/lib/helpers';
import { NilaiInputModal } from '@/components/NilaiInputModal';
import type { Jadwal, Tahap, Materi, Kelompok, Siswa, Absensi, TahunAkademik } from '@/types/firestore';

interface ActiveJadwal extends Jadwal {
  tahap_nama: string;
  materi_nama: string;
  kelompok_nama: string;
}

interface AbsensiRecord extends Absensi {
  siswa_nama: string;
  siswa_no_induk: string;
}

export default function AbsensiPOS() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [selectedTahap, setSelectedTahap] = useState('');
  const [materis, setMaterис] = useState<Materi[]>([]);
  const [selectedMateri, setSelectedMateri] = useState('');
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [selectedKelompok, setSelectedKelompok] = useState('');
  
  const [activeJadwal, setActiveJadwal] = useState<ActiveJadwal | null>(null);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [absensis, setAbsensis] = useState<AbsensiRecord[]>([]);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [allData, setAllData] = useState<{ tahaps: Tahap[]; materis: Materi[]; kelompoks: Kelompok[] } | null>(null);

  // Mode manual
  const [absensiMode, setAbsensiMode] = useState<'otomatis' | 'manual'>('otomatis');
  const [manualTanggal, setManualTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [manualJadwal, setManualJadwal] = useState<Jadwal | null>(null);
  const [manualJadwals, setManualJadwals] = useState<Jadwal[]>([]);
  const [manualAbsensis, setManualAbsensis] = useState<AbsensiRecord[]>([]);
  const [manualAbsensiData, setManualAbsensiData] = useState<{
    [siswaId: string]: 'hadir' | 'izin' | 'sakit' | 'alpha' | 'none';
  }>({});

  // Modal input nilai
  const [showNilaiModal, setShowNilaiModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [pertemuanKe, setPertemuanKe] = useState(1);
  const [existingNilai, setExistingNilai] = useState<{nilai: number; keterangan: string} | null>(null);

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadAllMasterData();
    }
  }, [selectedTahunAkademik]);

  useEffect(() => {
    if (absensiMode === 'otomatis' && selectedKelompok) {
      loadDataAbsensiOtomatis();
    }
  }, [selectedKelompok, absensiMode]);

  useEffect(() => {
    if (absensiMode === 'manual' && manualTanggal && selectedKelompok) {
      loadDataAbsensiManual();
    }
  }, [manualTanggal, absensiMode, selectedKelompok]);

  const loadTahunAkademik = async () => {
    try {
      const taRes = await fetch('/api/tahun-akademik');
      const taData = await taRes.json();
      
      if (taData.success) {
        setTahunAkademik(taData.data);
        
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

  const loadAllMasterData = async () => {
    try {
      setLoading(true);
      const [tahapData, materiData, kelompokData] = await Promise.all([
        masterDataService.getAllTahap(),
        masterDataService.getAllMateri(),
        masterDataService.getAllKelompok()
      ]);

      const filteredTahap = tahapData.filter(t => t.tahun_akademik_id === selectedTahunAkademik);
      
      setTahaps(filteredTahap);
      setMaterис(materiData);
      setKelompoks(kelompokData);
      setAllData({ tahaps: filteredTahap, materis: materiData, kelompoks: kelompokData });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading master data:', error);
      toast({
        title: "Gagal memuat data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadDataAbsensiOtomatis = async () => {
    try {
      setLoading(true);
      
      const [jadwals, enrollmentRes] = await Promise.all([
        masterDataService.getAllJadwal(),
        fetch(`/api/enrollment?tahun_akademik_id=${selectedTahunAkademik}`)
      ]);

      const enrollmentData = await enrollmentRes.json();
      let allSiswas: Siswa[] = [];
      let allEnrollments: any[] = [];
      
      if (enrollmentData.success) {
        allEnrollments = enrollmentData.data;
        allSiswas = enrollmentData.data
          .filter((e: any) => e.siswa)
          .map((e: any) => e.siswa);
      }

      const tahapIds = tahaps.map(t => t.id);
      const filteredJadwal = jadwals.filter(j => tahapIds.includes(j.tahap_id) && j.kelompok_id === selectedKelompok);

      const kelompokEnrollments = allEnrollments.filter(e => e.kelompok_id === selectedKelompok);
      const siswaIds = kelompokEnrollments.map(e => e.siswa_id);
      const siswaInKelompok = allSiswas.filter(s => siswaIds.includes(s.id));
      
      setSiswas(siswaInKelompok);
      setTotalSiswa(siswaInKelompok.length);

      if (filteredJadwal.length > 0) {
        const firstJadwal = filteredJadwal[0];
        const tahap = tahaps.find(t => t.id === firstJadwal.tahap_id);
        const materi = allData?.materis.find(m => m.id === firstJadwal.materi_id);
        const kelompok = allData?.kelompoks.find(k => k.id === firstJadwal.kelompok_id);

        const jadwalWithDetails: ActiveJadwal = {
          ...firstJadwal,
          tahap_nama: tahap?.nama_tahap || '-',
          materi_nama: materi?.nama_materi || '-',
          kelompok_nama: kelompok?.nama_kelompok || '-',
        };

        setActiveJadwal(jadwalWithDetails);
        await loadAbsensi(firstJadwal.id, siswaInKelompok);
        setScanning(true);
      } else {
        setActiveJadwal(null);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data otomatis:', error);
      toast({
        title: "Gagal memuat data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const loadDataAbsensiManual = async () => {
    try {
      setLoading(true);
      
      const [jadwals, absensiData, enrollmentRes] = await Promise.all([
        masterDataService.getJadwalByTanggal(manualTanggal),
        masterDataService.getAbsensiByTanggal(manualTanggal),
        fetch(`/api/enrollment?tahun_akademik_id=${selectedTahunAkademik}`)
      ]);

      const enrollmentData = await enrollmentRes.json();
      let allSiswas: Siswa[] = [];
      let allEnrollments: any[] = [];
      
      if (enrollmentData.success) {
        allEnrollments = enrollmentData.data;
        allSiswas = enrollmentData.data
          .filter((e: any) => e.siswa)
          .map((e: any) => e.siswa);
      }

      const filteredJadwals = selectedKelompok
        ? jadwals.filter(j => j.kelompok_id === selectedKelompok)
        : [];
      setManualJadwals(filteredJadwals);
      if (manualJadwal && !filteredJadwals.find(j => j.id === manualJadwal.id)) {
        setManualJadwal(null);
      }

      if (selectedKelompok) {
        const kelompokEnrollments = allEnrollments.filter(e => e.kelompok_id === selectedKelompok);
        const siswaIds = kelompokEnrollments.map(e => e.siswa_id);
        const siswaInKelompok = allSiswas.filter(s => siswaIds.includes(s.id));
        
        setSiswas(siswaInKelompok);
        setTotalSiswa(siswaInKelompok.length);

        const filteredAbsensi = absensiData
          .filter(a => siswaIds.includes(a.siswa_id))
          .map(a => {
            const siswa = siswaInKelompok.find(s => s.id === a.siswa_id);
            return {
              ...a,
              siswa_nama: siswa?.nama_lengkap || '-',
              siswa_no_induk: siswa?.no_induk || '-',
            };
          });

        setManualAbsensis(filteredAbsensi);

        const absensiRecords: { [key: string]: 'hadir' | 'izin' | 'sakit' | 'alpha' | 'none' } = {};
        siswaInKelompok.forEach(siswa => {
          const absen = filteredAbsensi.find(a => a.siswa_id === siswa.id);
          absensiRecords[siswa.id] = absen?.status || 'none';
        });
        setManualAbsensiData(absensiRecords);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data manual:', error);
      toast({
        title: "Gagal memuat data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleBack = () => {
    setScanning(false);
    
    setTimeout(() => {
      router.back();
    }, 100);
  };

  const loadAbsensi = async (jadwalId: string, siswaList: Siswa[]) => {
    try {
      const allAbsensi = await masterDataService.getAllAbsensi();
      const jadwalAbsensi = allAbsensi
        .filter(a => a.jadwal_id === jadwalId)
        .map(a => {
          const siswa = siswaList.find(s => s.id === a.siswa_id);
          return {
            ...a,
            siswa_nama: siswa?.nama_lengkap || '-',
            siswa_no_induk: siswa?.no_induk || '-',
          };
        })
        .sort((a, b) => {
          if (!a.waktu_scan || !b.waktu_scan) return 0;
          return new Date(b.waktu_scan).getTime() - new Date(a.waktu_scan).getTime();
        });

      setAbsensis(jadwalAbsensi);
    } catch (error) {
      console.error('Error loading absensi:', error);
    }
  };

  const handleScan = async (result: string) => {
    if (!activeJadwal || !scanning) return;

    try {
      const data = JSON.parse(result);
      
      if (data.type !== 'student_absensi') {
        toast({
          title: "QR Code tidak valid",
          description: "QR Code bukan untuk absensi siswa",
          variant: "destructive",
        });
        return;
      }

      const no_induk = data.no_induk;
      const siswa = siswas.find(s => s.no_induk === no_induk);
      
      if (!siswa) {
        toast({
          title: "Siswa tidak ditemukan",
          description: `No induk ${no_induk} tidak terdaftar di kelompok ini`,
          variant: "destructive",
        });
        return;
      }

      const duplicate = absensis.find(a => a.siswa_id === siswa.id);
      if (duplicate) {
        toast({
          title: "Sudah absen",
          description: `${siswa.nama_lengkap} sudah tercatat hadir`,
          variant: "default",
        });
        return;
      }

      setScanning(false);

      const newAbsensi: Omit<Absensi, 'id'> = {
        jadwal_id: activeJadwal.id,
        siswa_id: siswa.id,
        tahun_akademik_id: selectedTahunAkademik,
        tanggal: activeJadwal.tanggal,
        status: 'hadir',
        metode: 'qrcode',
        waktu_scan: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      await masterDataService.createAbsensi(newAbsensi);

      const riwayat = await masterDataService.getNilaiHarianBySiswaMateri(siswa.id, activeJadwal.materi_id);
      const riwayatSebelumnya = riwayat.filter(r => r.jadwal_id !== activeJadwal.id);
      const pertemuan = riwayatSebelumnya.length + 1;

      toast({
        title: "✅ Berhasil",
        description: `${siswa.nama_lengkap} - HADIR`,
      });

      await loadAbsensi(activeJadwal.id, siswas);

      setSelectedSiswa(siswa);
      setPertemuanKe(pertemuan);
      setShowNilaiModal(true);

    } catch (error) {
      console.error('Error handling scan:', error);
      toast({
        title: "Gagal memproses scan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      
      setTimeout(() => {
        setScanning(true);
      }, 1000);
    }
  };

  const handleSaveNilai = async (nilai: number, keterangan: string) => {
    if (!activeJadwal || !selectedSiswa) return;

    try {
      const now = new Date().toISOString();
      const existing = await masterDataService.getNilaiHarianByJadwal(activeJadwal.id);
      const existingNilai = existing.find(n => n.siswa_id === selectedSiswa.id);

      const nilaiData = {
        jadwal_id: activeJadwal.id,
        siswa_id: selectedSiswa.id,
        tahap_id: activeJadwal.tahap_id,
        materi_id: activeJadwal.materi_id,
        kelompok_id: activeJadwal.kelompok_id,
        tahun_akademik_id: selectedTahunAkademik,
        pertemuan_ke: pertemuanKe,
        nilai: nilai,
        keterangan: keterangan,
        tanggal_input: activeJadwal.tanggal,
        created_at: existingNilai?.created_at || now
      };

      if (existingNilai) {
        await masterDataService.updateNilaiHarian(existingNilai.id, nilaiData);
      } else {
        await masterDataService.createNilaiHarian(nilaiData);
      }

      toast({
        title: "Nilai tersimpan",
        description: `${selectedSiswa.nama_lengkap}: ${nilai}`,
      });

      setTimeout(() => {
        setScanning(true);
      }, 500);

    } catch (error) {
      console.error('Error saving nilai:', error);
      toast({
        title: "Gagal menyimpan nilai",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCloseModal = () => {
    setShowNilaiModal(false);
    setSelectedSiswa(null);
    setExistingNilai(null);
    
    setTimeout(() => {
      setScanning(true);
    }, 500);
  };

  const handleSaveAbsensiManual = async () => {
    if (!selectedKelompok) {
      toast({
        title: "Error",
        description: "Pilih kelompok terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      let counter = 0;
      for (const [siswaId, status] of Object.entries(manualAbsensiData)) {

        const existing = await masterDataService.getAbsensiByJadwalAndSiswa(
          manualJadwal?.id || 'manual-' + manualTanggal,
          siswaId
        );

        if (status === 'none') {
          if (existing) {
            await masterDataService.deleteAbsensi(existing.id);
            counter++;
          }
          continue;
        }

        const absensiData: any = {
          jadwal_id: manualJadwal?.id || 'manual-' + manualTanggal,
          siswa_id: siswaId,
          tahun_akademik_id: selectedTahunAkademik,
          tanggal: manualTanggal,
          status: status,
          metode: 'manual',
          waktu_scan: new Date().toISOString(),
          created_at: existing?.created_at || new Date().toISOString(),
        };

        if (existing) {
          await masterDataService.updateAbsensi(existing.id, absensiData);
        } else {
          await masterDataService.createAbsensi(absensiData);
        }
        counter++;
      }

      toast({
        title: "Tersimpan",
        description: `${counter} data absensi berhasil disimpan`,
      });

      await loadDataAbsensiManual();
    } catch (error) {
      console.error('Error saving absensi manual:', error);
      toast({
        title: "Gagal menyimpan",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={handleBack} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Absensi & Nilai</h1>
        </div>
        <div className="app-content flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={handleBack} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Absensi & Nilai</h1>
        </div>

        <div className="app-content p-4 space-y-4">
          <Tabs 
            value={absensiMode} 
            onValueChange={(v) => {
              setAbsensiMode(v as 'otomatis' | 'manual');
              setScanning(false);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="otomatis">Otomatis (QR)</TabsTrigger>
              <TabsTrigger value="manual">Manual</TabsTrigger>
            </TabsList>

            <TabsContent value="otomatis" className="space-y-4">
              {/* Selector untuk Kelompok */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pilih Kelompok</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Kelompok</Label>
                    <Select value={selectedKelompok} onValueChange={setSelectedKelompok}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelompok..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kelompoks.map(k => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.nama_kelompok}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {selectedKelompok && activeJadwal ? (
                <>
                  {/* Jadwal Info */}
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Jadwal Aktif</CardTitle>
                          <CardDescription>{formatDateIndo(activeJadwal.tanggal)}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-lg">
                          {absensis.length} / {totalSiswa}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Tahap:</span>
                          <p className="font-medium">{activeJadwal.tahap_nama}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Materi:</span>
                          <p className="font-medium">{activeJadwal.materi_nama}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kelompok:</span>
                          <p className="font-medium">{activeJadwal.kelompok_nama}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Waktu:</span>
                          <p className="font-medium">{activeJadwal.jam_mulai} - {activeJadwal.jam_selesai}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* QR Scanner */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrIcon className="h-5 w-5" />
                          <div>
                            <CardTitle className="text-base">Scanner QR Code</CardTitle>
                            <CardDescription className="text-xs">
                              Scan QR siswa → Input nilai langsung
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={scanning ? "destructive" : "default"}
                          onClick={() => setScanning(!scanning)}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          {scanning ? "Stop" : "Scan"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                        {scanning ? (
                          <Scanner
                            onScan={(result) => {
                              if (result && result.length > 0) {
                                handleScan(result[0].rawValue);
                              }
                            }}
                            onError={(error) => {
                              console.error('Scanner error:', error);
                            }}
                            constraints={{
                              facingMode: 'environment',
                            }}
                            styles={{
                              container: {
                                width: '100%',
                                height: '100%',
                              },
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-white">
                            <div className="text-center">
                              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm opacity-75">Scanner dihentikan</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Daftar Kehadiran */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-5 w-5" />
                        Daftar Kehadiran
                      </CardTitle>
                      <CardDescription>
                        {absensis.length} siswa sudah absen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {absensis.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>Belum ada siswa yang absen</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {absensis.map((absen, index) => (
                            <div
                              key={absen.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-sm">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-medium">{absen.siswa_nama}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {absen.siswa_no_induk}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge variant="secondary" className="mb-1">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  QR
                                </Badge>
                                <div className="text-xs text-muted-foreground">
                                  {absen.waktu_scan ? formatTime(new Date(absen.waktu_scan)) : '-'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Pilih kelompok terlebih dahulu untuk menampilkan scanner
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              {/* Selector untuk Tanggal dan Kelompok */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filter Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tanggal</Label>
                    <Input
                      type="date"
                      value={manualTanggal}
                      onChange={(e) => setManualTanggal(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Kelompok</Label>
                    <Select value={selectedKelompok} onValueChange={setSelectedKelompok}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelompok..." />
                      </SelectTrigger>
                      <SelectContent>
                        {kelompoks.map(k => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.nama_kelompok}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {manualJadwals.length > 0 && (
                    <div className="space-y-2">
                      <Label>Jadwal (Opsional)</Label>
                      <Select 
                        value={manualJadwal?.id || 'all-jadwal'} 
                        onValueChange={(id) => {
                          if (id === 'all-jadwal') {
                            setManualJadwal(null);
                          } else {
                            const j = manualJadwals.find(jd => jd.id === id);
                            setManualJadwal(j || null);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Semua jadwal / Tidak ada jadwal spesifik" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-jadwal">Semua jadwal / Tidak ada jadwal spesifik</SelectItem>
                          {manualJadwals.map(j => (
                            <SelectItem key={j.id} value={j.id}>
                              {formatDateIndo(j.tanggal)} | {j.jam_mulai} - {j.jam_selesai}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedKelompok && siswas.length > 0 && (
                <>
                  {/* Daftar Siswa untuk Input Manual */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Input Absensi Manual</CardTitle>
                      <CardDescription>
                        Pilih status kehadiran untuk setiap siswa
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {siswas.map((siswa) => (
                        <div key={siswa.id} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{siswa.nama_lengkap}</p>
                            <p className="text-xs text-muted-foreground">{siswa.no_induk}</p>
                          </div>
                          <Select
                            value={manualAbsensiData[siswa.id] || 'none'}
                            onValueChange={(val) => {
                              setManualAbsensiData(prev => ({
                                ...prev,
                                [siswa.id]: val as 'hadir' | 'izin' | 'sakit' | 'alpha' | 'none'
                              }));
                            }}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Tidak ada</SelectItem>
                              <SelectItem value="hadir">
                                <span className="text-green-600">Hadir</span>
                              </SelectItem>
                              <SelectItem value="izin">
                                <span className="text-blue-600">Izin</span>
                              </SelectItem>
                              <SelectItem value="sakit">
                                <span className="text-yellow-600">Sakit</span>
                              </SelectItem>
                              <SelectItem value="alpha">
                                <span className="text-red-600">Alpha</span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Tombol Simpan */}
                  <Button 
                    onClick={handleSaveAbsensiManual}
                    className="w-full"
                    size="lg"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Simpan Absensi Manual
                  </Button>
                </>
              )}

              {!selectedKelompok && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Pilih kelompok terlebih dahulu untuk menampilkan daftar siswa
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <NilaiInputModal
        open={showNilaiModal}
        onClose={handleCloseModal}
        onSave={handleSaveNilai}
        siswa={selectedSiswa}
        pertemuanKe={pertemuanKe}
        materiNama={activeJadwal?.materi_nama || ''}
        existingNilai={existingNilai}
      />
    </>
  );
}
