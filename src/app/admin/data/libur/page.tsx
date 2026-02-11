'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, Calendar, Globe, BookOpen, X } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { masterDataService } from '@/services/masterDataService';
import type { Libur, Tahap } from '@/types/firestore';

const HARI_OPTIONS = [
  { value: 'Senin', label: 'Senin' },
  { value: 'Selasa', label: 'Selasa' },
  { value: 'Rabu', label: 'Rabu' },
  { value: 'Kamis', label: 'Kamis' },
  { value: 'Jumat', label: 'Jumat' },
  { value: 'Sabtu', label: 'Sabtu' },
  { value: 'Minggu', label: 'Minggu' },
];

export default function DataLibur() {
  const router = useRouter();
  const [liburs, setLiburs] = useState<Libur[]>([]);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedLibur, setSelectedLibur] = useState<Libur | null>(null);
  const [formData, setFormData] = useState({
    tipe: 'tanggal' as 'tanggal' | 'hari',
    nilai: '',
    keterangan: '',
    scope: 'global' as 'global' | 'tahap',
    tahap_ids: [] as string[],
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [liburData, tahapData] = await Promise.all([
        masterDataService.getAllLibur(),
        masterDataService.getAllTahap(),
      ]);
      setLiburs(liburData);
      setTahaps(tahapData.sort((a, b) => a.urutan - b.urutan));
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

  const handleAdd = () => {
    setSelectedLibur(null);
    setFormData({ 
      tipe: 'tanggal', 
      nilai: '', 
      keterangan: '',
      scope: 'global',
      tahap_ids: [],
    });
    setOpenDialog(true);
  };

  const handleEdit = (libur: Libur) => {
    setSelectedLibur(libur);
    setFormData({
      tipe: libur.tipe,
      nilai: libur.nilai,
      keterangan: libur.keterangan,
      scope: libur.scope,
      tahap_ids: libur.tahap_ids || [],
    });
    setOpenDialog(true);
  };

  const handleDelete = (libur: Libur) => {
    setSelectedLibur(libur);
    setOpenDeleteDialog(true);
  };

  const toggleTahapId = (tahapId: string) => {
    setFormData(prev => ({
      ...prev,
      tahap_ids: prev.tahap_ids.includes(tahapId)
        ? prev.tahap_ids.filter(id => id !== tahapId)
        : [...prev.tahap_ids, tahapId]
    }));
  };

  const handleSubmit = async () => {
    if (!formData.nilai || !formData.keterangan) {
      toast({
        title: 'Error',
        description: 'Nilai dan keterangan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    if (formData.tipe === 'tanggal') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.nilai)) {
        toast({
          title: 'Error',
          description: 'Format tanggal harus YYYY-MM-DD',
          variant: 'destructive',
        });
        return;
      }
    }

    if (formData.scope === 'tahap' && formData.tahap_ids.length === 0) {
      toast({
        title: 'Error',
        description: 'Pilih minimal satu tahap untuk scope tahap',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        tipe: formData.tipe,
        nilai: formData.nilai,
        keterangan: formData.keterangan,
        scope: formData.scope,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (formData.scope === 'tahap') {
        payload.tahap_ids = formData.tahap_ids;
      } else {
        payload.tahap_ids = [];
      }

      if (selectedLibur) {
        await masterDataService.updateLibur(selectedLibur.id, {
          ...payload,
          created_at: selectedLibur.created_at,
        });
        toast({
          title: 'Berhasil',
          description: 'Data libur berhasil diupdate',
        });
      } else {
        await masterDataService.createLibur(payload);
        toast({
          title: 'Berhasil',
          description: 'Data libur berhasil ditambahkan',
        });
      }

      setOpenDialog(false);
      loadAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data libur',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedLibur) return;

    try {
      await masterDataService.deleteLibur(selectedLibur.id);
      toast({
        title: 'Berhasil',
        description: 'Data libur berhasil dihapus',
      });
      setOpenDeleteDialog(false);
      loadAllData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus data libur',
        variant: 'destructive',
      });
    }
  };

  const formatDisplayNilai = (libur: Libur) => {
    if (libur.tipe === 'tanggal') {
      const date = new Date(libur.nilai);
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return `Setiap hari ${libur.nilai}`;
  };

  const getTahapNames = (tahapIds: string[]) => {
    return tahapIds.map(id => tahaps.find(t => t.id === id)?.nama_tahap || '?').join(', ');
  };

  return (
    <div className="pb-20">
      <div className="app-topbar">
        <button onClick={() => router.push('/admin/data')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1>Data Hari Libur</h1>
        <span className="ml-auto text-sm opacity-80">{liburs.length} data</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : liburs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada data hari libur</p>
          </div>
        ) : (
          liburs.map((libur, i) => (
            <div
              key={libur.id}
              className="app-card animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {formatDisplayNilai(libur)}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {libur.keterangan}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {libur.scope === 'global' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            <Globe className="h-3 w-3" />
                            Semua Tahap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                            <BookOpen className="h-3 w-3" />
                            {libur.tahap_ids && libur.tahap_ids.length > 0 
                              ? getTahapNames(libur.tahap_ids)
                              : 'Tahap Tertentu'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(libur)}
                    className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(libur)}
                    className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="app-fab" onClick={handleAdd}>
        <Plus size={24} />
      </button>

      {/* Dialog Form */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLibur ? 'Edit Hari Libur' : 'Tambah Hari Libur'}
            </DialogTitle>
            <DialogDescription>
              Atur hari libur berdasarkan tanggal tertentu atau hari rutin
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipe">Tipe Libur</Label>
              <Select
                value={formData.tipe}
                onValueChange={(value: 'tanggal' | 'hari') =>
                  setFormData({ ...formData, tipe: value, nilai: '' })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tanggal">Tanggal Tertentu</SelectItem>
                  <SelectItem value="hari">Hari Rutin (Setiap Minggu)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipe === 'tanggal' ? (
              <div className="space-y-2">
                <Label htmlFor="nilai">Tanggal *</Label>
                <Input
                  id="nilai"
                  type="date"
                  className="rounded-xl"
                  value={formData.nilai}
                  onChange={(e) => setFormData({ ...formData, nilai: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Contoh: Libur tanggal 17 Agustus (HUT RI)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="hari">Hari *</Label>
                <Select
                  value={formData.nilai}
                  onValueChange={(value) => setFormData({ ...formData, nilai: value })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih hari" />
                  </SelectTrigger>
                  <SelectContent>
                    {HARI_OPTIONS.map((hari) => (
                      <SelectItem key={hari.value} value={hari.value}>
                        {hari.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Contoh: Setiap hari Minggu selalu libur
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan *</Label>
              <Input
                id="keterangan"
                className="rounded-xl"
                placeholder="Contoh: Libur Nasional"
                value={formData.keterangan}
                onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope">Berlaku Untuk</Label>
              <Select
                value={formData.scope}
                onValueChange={(value: 'global' | 'tahap') =>
                  setFormData({ ...formData, scope: value, tahap_ids: [] })
                }
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Semua Tahap</SelectItem>
                  <SelectItem value="tahap">Tahap Tertentu Saja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scope === 'tahap' && (
              <div className="space-y-2">
                <Label>Pilih Tahap *</Label>
                <div className="border rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                  {tahaps.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Belum ada data tahap
                    </p>
                  ) : (
                    tahaps.map((tahap) => (
                      <div key={tahap.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`tahap-${tahap.id}`}
                          checked={formData.tahap_ids.includes(tahap.id)}
                          onCheckedChange={() => toggleTahapId(tahap.id)}
                        />
                        <Label
                          htmlFor={`tahap-${tahap.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {tahap.nama_tahap}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                {formData.tahap_ids.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.tahap_ids.length} tahap dipilih
                  </p>
                )}
              </div>
            )}
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
            <AlertDialogTitle>Hapus Libur?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data libur ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
