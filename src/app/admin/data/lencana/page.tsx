'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
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
import type { Lencana } from '@/types/firestore';

const ICON_OPTIONS = [
  { value: '⭐', label: '⭐ Bintang' },
  { value: '🥇', label: '🥇 Emas' },
  { value: '🥈', label: '🥈 Perak' },
  { value: '🥉', label: '🥉 Perunggu' },
  { value: '🏆', label: '🏆 Piala' },
  { value: '🎖️', label: '🎖️ Medali' },
  { value: '💎', label: '💎 Berlian' },
  { value: '🌟', label: '🌟 Bersinar' },
];

export default function DataLencana() {
  const router = useRouter();
  const [lencanas, setLencanas] = useState<Lencana[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedLencana, setSelectedLencana] = useState<Lencana | null>(null);
  const [formData, setFormData] = useState({ 
    nama_lencana: '', 
    pencapaian: '', 
    nilai_min: '80',
    icon_url: '⭐'
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLencanas();
  }, []);

  const loadLencanas = async () => {
    try {
      setLoading(true);
      const data = await masterDataService.getAllLencana();
      setLencanas(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data lencana',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedLencana(null);
    setFormData({ nama_lencana: '', pencapaian: '', nilai_min: '80', icon_url: '⭐' });
    setOpenDialog(true);
  };

  const handleEdit = (lencana: Lencana) => {
    setSelectedLencana(lencana);
    setFormData({ 
      nama_lencana: lencana.nama_lencana, 
      pencapaian: lencana.pencapaian, 
      nilai_min: lencana.nilai_min.toString(),
      icon_url: lencana.icon_url || '⭐'
    });
    setOpenDialog(true);
  };

  const handleDelete = (lencana: Lencana) => {
    setSelectedLencana(lencana);
    setOpenDeleteDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nama_lencana || !formData.pencapaian || !formData.nilai_min) {
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
        nama_lencana: formData.nama_lencana,
        pencapaian: formData.pencapaian,
        nilai_min: parseInt(formData.nilai_min),
        icon_url: formData.icon_url,
      };

      if (selectedLencana) {
        await masterDataService.updateLencana(selectedLencana.id, data);
        toast({ title: 'Sukses', description: 'Lencana berhasil diupdate' });
      } else {
        await masterDataService.createLencana(data as any);
        toast({ title: 'Sukses', description: 'Lencana berhasil ditambahkan' });
      }

      setOpenDialog(false);
      loadLencanas();
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
    if (!selectedLencana) return;

    try {
      await masterDataService.deleteLencana(selectedLencana.id);
      toast({ title: 'Sukses', description: 'Lencana berhasil dihapus' });
      setOpenDeleteDialog(false);
      loadLencanas();
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
          <h1>Data Lencana</h1>
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
        <h1>Data Lencana</h1>
        <span className="ml-auto text-sm opacity-80">{lencanas.length} data</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {lencanas.length === 0 && <div className="text-center py-12 text-muted-foreground"><p>Belum ada data lencana</p></div>}
        {lencanas.map((lencana, i) => (
          <div key={lencana.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-foreground">
                  <span className="text-2xl mr-2">{lencana.icon_url || '⭐'}</span>
                  {lencana.nama_lencana}
                </h3>
                <p className="text-sm text-muted-foreground">{lencana.pencapaian}</p>
                <p className="text-sm text-muted-foreground">Nilai Min: {lencana.nilai_min}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(lencana)} className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"><Pencil size={18} /></button>
                <button onClick={() => handleDelete(lencana)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="app-fab" onClick={handleAdd}><Plus size={24} /></button>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{selectedLencana ? 'Edit' : 'Tambah'} Lencana</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama Lencana <span className="text-destructive">*</span></Label>
                <Input
                  className="rounded-xl"
                  placeholder="Contoh: Bintang Emas"
                  value={formData.nama_lencana}
                  onChange={(e) => setFormData({ ...formData, nama_lencana: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pencapaian <span className="text-destructive">*</span></Label>
                <Input
                  className="rounded-xl"
                  placeholder="Contoh: IPK >= 3.5"
                  value={formData.pencapaian}
                  onChange={(e) => setFormData({ ...formData, pencapaian: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Nilai Minimum <span className="text-destructive">*</span></Label>
                <Input
                  className="rounded-xl"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="80"
                  value={formData.nilai_min}
                  onChange={(e) => setFormData({ ...formData, nilai_min: e.target.value })}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Icon <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.icon_url}
                  onValueChange={(value) => setFormData({ ...formData, icon_url: value })}
                  disabled={submitting}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Pilih icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <AlertDialogTitle>Hapus Lencana?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{selectedLencana?.nama_lencana}</strong>?
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
