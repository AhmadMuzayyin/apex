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
import type { Materi } from '@/types/firestore';

export default function DataMateri() {
  const router = useRouter();
  const [materis, setMateris] = useState<Materi[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMateri, setSelectedMateri] = useState<Materi | null>(null);
  const [formData, setFormData] = useState({ nama_materi: '', skt: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMateris();
  }, []);

  const loadMateris = async () => {
    try {
      setLoading(true);
      const data = await masterDataService.getAllMateri();
      setMateris(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data materi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedMateri(null);
    setFormData({ nama_materi: '', skt: '2' });
    setOpenDialog(true);
  };

  const handleEdit = (materi: Materi) => {
    setSelectedMateri(materi);
    setFormData({ nama_materi: materi.nama_materi, skt: materi.skt.toString() });
    setOpenDialog(true);
  };

  const handleDelete = (materi: Materi) => {
    setSelectedMateri(materi);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_materi || !formData.skt) {
      toast({
        title: 'Validasi Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        nama_materi: formData.nama_materi,
        skt: parseInt(formData.skt),
      };

      if (selectedMateri) {
        await masterDataService.updateMateri(selectedMateri.id, data);
        toast({ title: 'Sukses', description: 'Materi berhasil diupdate' });
      } else {
        await masterDataService.createMateri(data as any);
        toast({ title: 'Sukses', description: 'Materi berhasil ditambahkan' });
      }

      setOpenDialog(false);
      loadMateris();
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
    if (!selectedMateri) return;

    try {
      await masterDataService.deleteMateri(selectedMateri.id);
      toast({ title: 'Sukses', description: 'Materi berhasil dihapus' });
      setOpenDeleteDialog(false);
      loadMateris();
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
          <h1>Data Materi</h1>
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
        <h1>Data Materi</h1>
        <span className="ml-auto text-sm opacity-80">{materis.length} data</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {materis.length === 0 && <div className="text-center py-12 text-muted-foreground"><p>Belum ada data materi</p></div>}
        {materis.map((materi, i) => (
          <div key={materi.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground">{materi.nama_materi}</h3>
                <p className="text-sm text-muted-foreground">SKT: {materi.skt}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(materi)} className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(materi)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="app-fab" onClick={handleAdd}><Plus size={24} /></button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMateri ? 'Edit' : 'Tambah'} Materi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama Materi <span className="text-destructive">*</span></Label>
                <Input
                  className="rounded-xl"
                  placeholder="Contoh: Al-Quran"
                  value={formData.nama_materi}
                  onChange={(e) => setFormData({ ...formData, nama_materi: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>SKT <span className="text-destructive">*</span></Label>
                <Input
                  className="rounded-xl"
                  type="number"
                  min="1"
                  placeholder="2"
                  value={formData.skt}
                  onChange={(e) => setFormData({ ...formData, skt: e.target.value })}
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
            <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedMateri?.nama_materi}</strong>?
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
