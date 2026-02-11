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
import type { Kelompok } from '@/types/firestore';

export default function DataKelompok() {
  const router = useRouter();
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedKelompok, setSelectedKelompok] = useState<Kelompok | null>(null);
  const [formData, setFormData] = useState({ nama_kelompok: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKelompoks();
  }, []);

  const loadKelompoks = async () => {
    try {
      setLoading(true);
      const data = await masterDataService.getAllKelompok();
      setKelompoks(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data kelompok',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedKelompok(null);
    setFormData({ nama_kelompok: '' });
    setOpenDialog(true);
  };

  const handleEdit = (kelompok: Kelompok) => {
    setSelectedKelompok(kelompok);
    setFormData({ nama_kelompok: kelompok.nama_kelompok });
    setOpenDialog(true);
  };

  const handleDelete = (kelompok: Kelompok) => {
    setSelectedKelompok(kelompok);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_kelompok) {
      toast({
        title: 'Validasi Error',
        description: 'Nama kelompok harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        nama_kelompok: formData.nama_kelompok,
      };

      if (selectedKelompok) {
        await masterDataService.updateKelompok(selectedKelompok.id, data);
        toast({ title: 'Sukses', description: 'Kelompok berhasil diupdate' });
      } else {
        await masterDataService.createKelompok(data as any);
        toast({ title: 'Sukses', description: 'Kelompok berhasil ditambahkan' });
      }

      setOpenDialog(false);
      loadKelompoks();
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
    if (!selectedKelompok) return;

    try {
      await masterDataService.deleteKelompok(selectedKelompok.id);
      toast({ title: 'Sukses', description: 'Kelompok berhasil dihapus' });
      setOpenDeleteDialog(false);
      loadKelompoks();
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
          <h1>Data Kelompok</h1>
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
        <h1>Data Kelompok</h1>
        <span className="ml-auto text-sm opacity-80">{kelompoks.length} data</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {kelompoks.length === 0 && <div className="text-center py-12 text-muted-foreground"><p>Belum ada data kelompok</p></div>}
        {kelompoks.map((kelompok, i) => (
          <div key={kelompok.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground">{kelompok.nama_kelompok}</h3>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(kelompok)} className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(kelompok)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="app-fab" onClick={handleAdd}><Plus size={24} /></button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedKelompok ? 'Edit' : 'Tambah'} Kelompok</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama Kelompok <span className="text-destructive">*</span></Label>
                <Input
                  className="rounded-xl"
                  placeholder="Contoh: Kelompok A"
                  value={formData.nama_kelompok}
                  onChange={(e) => setFormData({ ...formData, nama_kelompok: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpenDialog(false)} disabled={submitting}>Batal</Button>
                <Button type="submit" className="flex-1 rounded-xl" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="max-w-[85vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kelompok?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedKelompok?.nama_kelompok}</strong>?
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
