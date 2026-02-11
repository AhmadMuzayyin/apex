'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { Tahap } from '@/types/firestore';

export default function DataTahap() {
  const router = useRouter();
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTahap, setSelectedTahap] = useState<Tahap | null>(null);
  const [formData, setFormData] = useState({ 
    nama_tahap: '', 
    urutan: '',
    tanggal_mulai: '',
    tanggal_selesai: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTahaps();
  }, []);

  const loadTahaps = async () => {
    try {
      setLoading(true);
      const data = await masterDataService.getAllTahap();
      setTahaps(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data tahap',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedTahap(null);
    setFormData({ nama_tahap: '', urutan: '', tanggal_mulai: '', tanggal_selesai: '' });
    setOpenDialog(true);
  };

  const handleEdit = (tahap: Tahap) => {
    setSelectedTahap(tahap);
    setFormData({ 
      nama_tahap: tahap.nama_tahap, 
      urutan: tahap.urutan.toString(),
      tanggal_mulai: tahap.tanggal_mulai,
      tanggal_selesai: tahap.tanggal_selesai
    });
    setOpenDialog(true);
  };

  const handleDelete = (tahap: Tahap) => {
    setSelectedTahap(tahap);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_tahap || !formData.urutan || !formData.tanggal_mulai || !formData.tanggal_selesai) {
      toast({
        title: 'Validasi Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    // Validate tanggal_selesai >= tanggal_mulai
    if (new Date(formData.tanggal_selesai) < new Date(formData.tanggal_mulai)) {
      toast({
        title: 'Validasi Error',
        description: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Auto-calculate status based on dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const mulai = new Date(formData.tanggal_mulai);
      const selesai = new Date(formData.tanggal_selesai);
      
      let status: 'draft' | 'aktif' | 'selesai';
      if (today < mulai) {
        status = 'draft';
      } else if (today > selesai) {
        status = 'selesai';
      } else {
        status = 'aktif';
      }

      const data = {
        nama_tahap: formData.nama_tahap,
        urutan: parseInt(formData.urutan),
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai,
        status,
      };

      if (selectedTahap) {
        await masterDataService.updateTahap(selectedTahap.id, data);
        toast({ title: 'Sukses', description: 'Tahap berhasil diupdate' });
      } else {
        await masterDataService.createTahap(data as any);
        toast({ title: 'Sukses', description: 'Tahap berhasil ditambahkan' });
      }

      setOpenDialog(false);
      loadTahaps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan data',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTahap) return;

    try {
      await masterDataService.deleteTahap(selectedTahap.id);
      toast({ title: 'Sukses', description: 'Tahap berhasil dihapus' });
      setOpenDeleteDialog(false);
      loadTahaps();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus data',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/data')} className="p-1"><ArrowLeft size={22} /></button>
          <h1>Data Tahap</h1>
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
        <button onClick={() => router.push('/admin/data')} className="p-1"><ArrowLeft size={22} /></button>
        <h1>Data Tahap</h1>
        <span className="ml-auto text-sm opacity-80">{tahaps.length} data</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {tahaps.length === 0 && <div className="text-center py-12 text-muted-foreground"><p>Belum ada data tahap</p></div>}
        {tahaps.map((tahap, i) => {
          const getStatusBadge = () => {
            const colors = {
              draft: 'bg-gray-100 text-gray-700',
              aktif: 'bg-green-100 text-green-700',
              selesai: 'bg-blue-100 text-blue-700'
            };
            return (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${ colors[tahap.status]}`}>
                {tahap.status === 'draft' ? 'Belum Dimulai' : tahap.status === 'aktif' ? 'Sedang Berjalan' : 'Selesai'}
              </span>
            );
          };

          const formatDate = (dateStr: string) => {
            return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
          };

          return (
            <div key={tahap.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{tahap.nama_tahap}</h3>
                    {getStatusBadge()}
                  </div>
                  <p className="text-sm text-muted-foreground">Urutan: {tahap.urutan}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDate(tahap.tanggal_mulai)} - {formatDate(tahap.tanggal_selesai)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(tahap)} className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"><Pencil size={18} /></button>
                  <button onClick={() => handleDelete(tahap)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={18} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="app-fab" onClick={handleAdd}><Plus size={24} /></button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTahap ? 'Edit Tahap' : 'Tambah Tahap'}</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk {selectedTahap ? 'mengupdate' : 'menambahkan'} tahap
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama_tahap">Nama Tahap *</Label>
                <Input
                  id="nama_tahap"
                  className="rounded-xl"
                  placeholder="Contoh: Tahap 1"
                  value={formData.nama_tahap}
                  onChange={(e) => setFormData({ ...formData, nama_tahap: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="urutan">Urutan *</Label>
                <Input
                  id="urutan"
                  className="rounded-xl"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={formData.urutan}
                  onChange={(e) => setFormData({ ...formData, urutan: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_mulai">Tanggal Mulai *</Label>
                <Input
                  id="tanggal_mulai"
                  className="rounded-xl"
                  type="date"
                  value={formData.tanggal_mulai}
                  onChange={(e) => setFormData({ ...formData, tanggal_mulai: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tanggal_selesai">Tanggal Selesai *</Label>
                <Input
                  id="tanggal_selesai"
                  className="rounded-xl"
                  type="date"
                  value={formData.tanggal_selesai}
                  onChange={(e) => setFormData({ ...formData, tanggal_selesai: e.target.value })}
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">Status akan otomatis dihitung berdasarkan tanggal hari ini</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setOpenDialog(false)}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button type="submit" className="flex-1 rounded-xl" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="max-w-[85vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tahap?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedTahap?.nama_tahap}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
