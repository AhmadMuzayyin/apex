'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, CheckCircle, Users, AlertCircle, Loader2, QrCode as QrIcon } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { masterDataService } from '@/services/masterDataService';
import { formatTime, formatDateIndo } from '@/lib/helpers';
import { NilaiInputModal } from '@/components/NilaiInputModal';
import type { Jadwal, Tahap, Materi, Kelompok, Siswa, Absensi } from '@/types/firestore';

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
  const [activeJadwal, setActiveJadwal] = useState<ActiveJadwal | null>(null);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [absensis, setAbsensis] = useState<AbsensiRecord[]>([]);
  const [totalSiswa, setTotalSiswa] = useState(0);

  // Modal input nilai
  const [showNilaiModal, setShowNilaiModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
  const [pertemuanKe, setPertemuanKe] = useState(1);
  const [existingNilai, setExistingNilai] = useState<{nilai: number; keterangan: string} | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      setScanning(false);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const handleBack = () => {
    // Stop camera first
    setScanning(false);
    
    // Small delay to ensure camera stops
    setTimeout(() => {
      router.back();
    }, 100);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [jadwals, tahaps, materis, kelompoks, allSiswas] = await Promise.all([
        masterDataService.getAllJadwal(),
        masterDataService.getAllTahap(),
        masterDataService.getAllMateri(),
        masterDataService.getAllKelompok(),
        masterDataService.getAllSiswa(),
      ]);

      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const tolerance = 30;

      const active = jadwals.find((j) => {
        if (j.tanggal !== today) return false;
        
        const [startH, startM] = j.jam_mulai.split(':').map(Number);
        const [endH, endM] = j.jam_selesai.split(':').map(Number);
        const startTime = startH * 60 + startM;
        const endTime = endH * 60 + endM;
        
        if (endTime < startTime) {
          return (currentMinutes >= (startTime - tolerance)) || (currentMinutes <= endTime);
        } else {
          return currentMinutes >= (startTime - tolerance) && currentMinutes <= endTime;
        }
      });

      if (!active) {
        setLoading(false);
        return;
      }

      const tahap = tahaps.find(t => t.id === active.tahap_id);
      const materi = materis.find(m => m.id === active.materi_id);
      const kelompok = kelompoks.find(k => k.id === active.kelompok_id);

      const jadwalWithDetails: ActiveJadwal = {
        ...active,
        tahap_nama: tahap?.nama_tahap || '-',
        materi_nama: materi?.nama_materi || '-',
        kelompok_nama: kelompok?.nama_kelompok || '-',
      };

      setActiveJadwal(jadwalWithDetails);

      const siswaInKelompok = allSiswas.filter(s => s.kelompok_id === active.kelompok_id);
      setSiswas(siswaInKelompok);
      setTotalSiswa(siswaInKelompok.length);

      await loadAbsensi(active.id, siswaInKelompok);

      setLoading(false);
      setScanning(true);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Gagal memuat data",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      });
      setLoading(false);
    }
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

  if (!activeJadwal) {
    return (
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={handleBack} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Absensi & Nilai</h1>
        </div>

        <div className="app-content p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tidak ada jadwal aktif saat ini</strong>
              <br />
              <span className="text-sm">
                Absensi hanya dapat dilakukan saat ada jadwal yang sedang berlangsung.
              </span>
            </AlertDescription>
          </Alert>
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
          <div className="ml-auto">
            <Button
              size="sm"
              variant={scanning ? "destructive" : "default"}
              onClick={() => setScanning(!scanning)}
            >
              <Camera className="h-4 w-4 mr-1" />
              {scanning ? "Stop" : "Scan"}
            </Button>
          </div>
        </div>

        <div className="app-content p-4 space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrIcon className="h-5 w-5" />
                Scanner QR Code
              </CardTitle>
              <CardDescription>
                Scan QR siswa → Input nilai langsung
              </CardDescription>
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
        </div>
      </div>

      <NilaiInputModal
        open={showNilaiModal}
        onClose={handleCloseModal}
        onSave={handleSaveNilai}
        siswa={selectedSiswa}
        pertemuanKe={pertemuanKe}
        materiNama={activeJadwal.materi_nama}
        existingNilai={existingNilai}
      />
    </>
  );
}
