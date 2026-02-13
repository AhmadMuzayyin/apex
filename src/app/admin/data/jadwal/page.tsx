'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { masterDataService } from '@/services/masterDataService';
import type { Jadwal, Tahap, Materi, Kelompok, Libur, TahunAkademik } from '@/types/firestore';

const HARI_INDO = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function DataJadwal() {
  const router = useRouter();
  const [jadwals, setJadwals] = useState<Jadwal[]>([]);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [liburs, setLiburs] = useState<Libur[]>([]);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<Jadwal | null>(null);
  const [filterTahapId, setFilterTahapId] = useState<string>('');
  const [formData, setFormData] = useState({
    tanggal: '',
    tahap_id: '',
    materi_id: '',
    kelompok_id: '',
    jam_mulai: '08:00',
    jam_selesai: '10:00',
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadDataByTahunAkademik();
    }
  }, [selectedTahunAkademik]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load tahun akademik
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

      // Load materi and kelompok (not scoped by tahun akademik)
      const [materiData, kelompokData] = await Promise.all([
        masterDataService.getAllMateri(),
        masterDataService.getAllKelompok(),
      ]);
      setMateris(materiData);
      setKelompoks(kelompokData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDataByTahunAkademik = async () => {
    try {
      const [jadwalData, tahapData, liburData] = await Promise.all([
        masterDataService.getAllJadwal(),
        masterDataService.getAllTahap(),
        masterDataService.getAllLibur(),
      ]);
      
      // Filter by tahun akademik
      const filteredTahap = tahapData.filter(t => t.tahun_akademik_id === selectedTahunAkademik);
      const filteredJadwal = jadwalData.filter(j => {
        const tahap = filteredTahap.find(t => t.id === j.tahap_id);
        return tahap !== undefined;
      });
      const filteredLibur = liburData.filter(l => l.tahun_akademik_id === selectedTahunAkademik);
      
      setJadwals(filteredJadwal);
      setTahaps(filteredTahap.sort((a, b) => b.urutan - a.urutan)); // Latest first
      setLiburs(filteredLibur);
      
      // Auto-select first active tahap
      const activeTahap = filteredTahap.find(t => t.status === 'aktif') || filteredTahap[0];
      if (activeTahap) {
        setFilterTahapId(activeTahap.id);
      } else {
        setFilterTahapId('');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data',
        variant: 'destructive',
      });
    }
  };

  // Helper functions
  const getTahapName = (id: string) => tahaps.find(t => t.id === id)?.nama_tahap || 'Unknown';
  const getMateriName = (id: string) => materis.find(m => m.id === id)?.nama_materi || 'Unknown';
  const getKelompokName = (id: string) => kelompoks.find(k => k.id === id)?.nama_kelompok || 'Unknown';
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayName = HARI_INDO[date.getDay()];
    const dateFormatted = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${dayName}, ${dateFormatted}`;
  };

  const getHariFromDate = (dateStr: string) => {
    return HARI_INDO[new Date(dateStr).getDay()];
  };

  const isLibur = (tanggal: string, tahapId: string): { isLibur: boolean; keterangan?: string } => {
    const hari = getHariFromDate(tanggal);
    
    // Check libur hari (recurring day)
    const liburHari = liburs.find(l => 
      l.tipe === 'hari' && 
      l.nilai === hari &&
      (l.scope === 'global' || (l.scope === 'tahap' && l.tahap_ids?.includes(tahapId)))
    );
    if (liburHari) {
      return { isLibur: true, keterangan: liburHari.keterangan };
    }

    // Check libur tanggal (specific date)
    const liburTanggal = liburs.find(l =>
      l.tipe === 'tanggal' &&
      l.nilai === tanggal &&
      (l.scope === 'global' || (l.scope === 'tahap' && l.tahap_ids?.includes(tahapId)))
    );
    if (liburTanggal) {
      return { isLibur: true, keterangan: liburTanggal.keterangan };
    }

    return { isLibur: false };
  };

  // Filtered and grouped jadwals
  const filteredJadwals = useMemo(() => {
    if (!filterTahapId) return [];
    const filtered = jadwals.filter(j => j.tahap_id === filterTahapId);
    return filtered.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [jadwals, filterTahapId]);

  const groupedByDate = useMemo(() => {
    const groups: { tanggal: string; jadwals: Jadwal[] }[] = [];
    filteredJadwals.forEach(jadwal => {
      let group = groups.find(g => g.tanggal === jadwal.tanggal);
      if (!group) {
        group = { tanggal: jadwal.tanggal, jadwals: [] };
        groups.push(group);
      }
      group.jadwals.push(jadwal);
    });
    return groups;
  }, [filteredJadwals]);

  const selectedTahap = tahaps.find(t => t.id === filterTahapId);

  const handleAdd = () => {
    setSelectedJadwal(null);
    setFormData({
      tanggal: '',
      tahap_id: filterTahapId,
      materi_id: '',
      kelompok_id: '',
      jam_mulai: '08:00',
      jam_selesai: '10:00',
    });
    setOpenDialog(true);
  };

  const handleEdit = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setFormData({
      tanggal: jadwal.tanggal,
      tahap_id: jadwal.tahap_id,
      materi_id: jadwal.materi_id,
      kelompok_id: jadwal.kelompok_id,
      jam_mulai: jadwal.jam_mulai,
      jam_selesai: jadwal.jam_selesai,
    });
    setOpenDialog(true);
  };

  const handleDelete = (jadwal: Jadwal) => {
    setSelectedJadwal(jadwal);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.tanggal || !formData.tahap_id || !formData.materi_id || !formData.kelompok_id) {
      toast({
        title: 'Error',
        description: 'Tanggal, Tahap, Materi, dan Kelompok harus diisi',
        variant: 'destructive',
      });
      return;
    }

    // Validate tanggal within tahap range
    const tahap = tahaps.find(t => t.id === formData.tahap_id);
    if (tahap) {
      const tanggal = new Date(formData.tanggal);
      const mulai = new Date(tahap.tanggal_mulai);
      const selesai = new Date(tahap.tanggal_selesai);
      
      if (tanggal < mulai || tanggal > selesai) {
        toast({
          title: 'Tanggal Tidak Valid',
          description: `Tanggal harus dalam periode ${tahap.nama_tahap} (${formatDate(tahap.tanggal_mulai)} - ${formatDate(tahap.tanggal_selesai)})`,
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate libur
    const liburCheck = isLibur(formData.tanggal, formData.tahap_id);
    if (liburCheck.isLibur) {
      toast({
        title: 'Tidak Dapat Menjadwal',
        description: `${formatDate(formData.tanggal)} adalah hari libur: ${liburCheck.keterangan}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        tahun_akademik_id: selectedTahunAkademik,
        status: 'scheduled' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (selectedJadwal) {
        await masterDataService.updateJadwal(selectedJadwal.id, {
          ...payload,
          created_at: selectedJadwal.created_at,
        });
        toast({
          title: 'Berhasil',
          description: 'Jadwal berhasil diupdate',
        });
      } else {
        await masterDataService.createJadwal(payload);
        toast({
          title: 'Berhasil',
          description: 'Jadwal berhasil ditambahkan',
        });
      }

      setOpenDialog(false);
      loadDataByTahunAkademik();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan jadwal',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedJadwal) return;
    try {
      await masterDataService.deleteJadwal(selectedJadwal.id);
      toast({ title: 'Berhasil', description: 'Jadwal berhasil dihapus' });
      setOpenDeleteDialog(false);
      loadDataByTahunAkademik();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus jadwal',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/data')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Data Jadwal</h1>
        </div>
        <div className="app-content flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="app-topbar">
        <button onClick={() => router.push('/admin/data')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1>Data Jadwal</h1>
        <span className="ml-auto text-sm opacity-80">{filteredJadwals.length} data</span>
      </div>

      {/* Filter Tahun Akademik & Tahap */}
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

        {/* Filter Tahap */}
        <div className="space-y-2">
          <Label htmlFor="filter-tahap">Filter Tahap</Label>
          <Select value={filterTahapId} onValueChange={setFilterTahapId}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Pilih Tahap" />
            </SelectTrigger>
            <SelectContent>
              {tahaps.map((tahap) => {
                const statusColor = {
                  draft: 'text-gray-600',
                  aktif: 'text-green-600',
                  selesai: 'text-blue-600'
                }[tahap.status];
                return (
                  <SelectItem key={tahap.id} value={tahap.id}>
                    <span className={statusColor}>
                      {tahap.nama_tahap} ({tahap.status})
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {selectedTahap && (
            <p className="text-xs text-muted-foreground">
              Periode: {formatDate(selectedTahap.tanggal_mulai)} - {formatDate(selectedTahap.tanggal_selesai)}
            </p>
          )}
        </div>

        {/* List Jadwal */}
        <div className="space-y-4 mt-4">
        {!filterTahapId ? (
          <div className="text-center py-8 text-muted-foreground">
            Pilih tahap untuk melihat jadwal
          </div>
        ) : filteredJadwals.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Belum ada jadwal untuk {getTahapName(filterTahapId)}</p>
              <p className="text-sm mt-2">Total jadwal di database: {jadwals.length}</p>
              {jadwals.length > 0 && (
                <p className="text-xs mt-1 text-orange-600">
                  ⚠️ Ada {jadwals.length} jadwal di database tapi tidak cocok dengan tahap ini.
                  <br />Mungkin data lama menggunakan struktur berbeda.
                </p>
              )}
            </div>
            <Button onClick={handleAdd} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Jadwal Pertama
            </Button>
          </div>
        ) : (
          <>
            {groupedByDate.length === 0 ? (
              <div className="text-center py-8 text-red-500">
                ⚠️ DEBUG: groupedByDate is empty but should have data!
              </div>
            ) : (
              groupedByDate.map((group, gIdx) => (
            <div key={group.tanggal} className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary px-2">
                <Calendar className="h-4 w-4" />
                {formatDate(group.tanggal)}
              </div>
              {group.jadwals.map((jadwal, idx) => (
                <div
                  key={jadwal.id}
                  className="app-card animate-fade-in"
                  style={{ animationDelay: `${(gIdx * 50) + (idx * 30)}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium mb-1">
                          {getMateriName(jadwal.materi_id)}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          {getKelompokName(jadwal.kelompok_id)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {jadwal.jam_mulai} - {jadwal.jam_selesai}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(jadwal)}
                        className="h-9 w-9"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(jadwal)}
                        className="h-9 w-9 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
            )}
          </>
        )}
        </div>
      </div>

      <button onClick={handleAdd} className="app-fab" disabled={!filterTahapId}>
        <Plus size={24} />
      </button>

      {/* Dialog Form */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedJadwal ? 'Edit Jadwal' : 'Tambah Jadwal'}
            </DialogTitle>
            <DialogDescription>
              {selectedJadwal
                ? 'Edit jadwal pembelajaran'
                : 'Tambah jadwal pembelajaran baru per tanggal'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tahap_id">Tahap</Label>
              <Select
                value={formData.tahap_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, tahap_id: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih tahap" />
                </SelectTrigger>
                <SelectContent>
                  {tahaps.map((tahap) => (
                    <SelectItem key={tahap.id} value={tahap.id}>
                      {tahap.nama_tahap}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tanggal">Tanggal</Label>
              <Input
                id="tanggal"
                type="date"
                className="rounded-xl"
                value={formData.tanggal}
                onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                min={selectedTahap?.tanggal_mulai}
                max={selectedTahap?.tanggal_selesai}
              />
              {formData.tanggal && (
                <p className="text-xs text-muted-foreground">
                  {formatDate(formData.tanggal)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="materi_id">Materi</Label>
              <Select
                value={formData.materi_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, materi_id: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih materi" />
                </SelectTrigger>
                <SelectContent>
                  {materis.map((materi) => (
                    <SelectItem key={materi.id} value={materi.id}>
                      {materi.nama_materi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kelompok_id">Kelompok</Label>
              <Select
                value={formData.kelompok_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, kelompok_id: value })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {kelompoks.map((kelompok) => (
                    <SelectItem key={kelompok.id} value={kelompok.id}>
                      {kelompok.nama_kelompok}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jam_mulai">Jam Mulai</Label>
                <Input
                  id="jam_mulai"
                  type="time"
                  className="rounded-xl"
                  value={formData.jam_mulai}
                  onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jam_selesai">Jam Selesai</Label>
                <Input
                  id="jam_selesai"
                  type="time"
                  className="rounded-xl"
                  value={formData.jam_selesai}
                  onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDialog(false)}
              disabled={submitting}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Jadwal?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
