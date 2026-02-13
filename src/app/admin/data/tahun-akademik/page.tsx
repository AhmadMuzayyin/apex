'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TahunAkademik } from '@/types/firestore';

export default function TahunAkademikPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<TahunAkademik | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    tahun: '',
    tanggal_mulai: '',
    tanggal_selesai: '',
    status: 'draft' as 'draft' | 'aktif' | 'selesai',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tahun-akademik');
      const data = await res.json();
      
      if (data.success) {
        setTahunAkademik(data.data);
      }
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

  const openAdd = () => {
    setForm({
      tahun: '',
      tanggal_mulai: '',
      tanggal_selesai: '',
      status: 'draft',
    });
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (ta: TahunAkademik) => {
    setForm({
      tahun: ta.tahun,
      tanggal_mulai: ta.tanggal_mulai,
      tanggal_selesai: ta.tanggal_selesai,
      status: ta.status,
    });
    setEditItem(ta);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.tahun || !form.tanggal_mulai || !form.tanggal_selesai || !form.status) {
      toast({
        title: 'Validasi Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editItem) {
        // Update via server API
        const res = await fetch(`/api/tahun-akademik/${editItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        toast({ title: 'Sukses', description: 'Tahun akademik berhasil diupdate' });
      } else {
        // Create
        const res = await fetch('/api/tahun-akademik', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message);

        toast({ title: 'Sukses', description: 'Tahun akademik berhasil ditambahkan' });
      }
      
      setDialogOpen(false);
      loadData();
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

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/tahun-akademik/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      toast({ title: 'Sukses', description: 'Tahun akademik berhasil dihapus' });
      setDeleteId(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus data',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      aktif: 'bg-green-100 text-green-700',
      draft: 'bg-gray-100 text-gray-700',
      selesai: 'bg-blue-100 text-blue-700',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      aktif: 'Aktif',
      draft: 'Draft',
      selesai: 'Selesai',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (loading) {
    return (
      <div>
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/data')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Tahun Akademik</h1>
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
        <h1>Tahun Akademik</h1>
        <span className="ml-auto text-sm opacity-80">{tahunAkademik.length} periode</span>
      </div>

      <div className="app-content p-4 space-y-3">
        {tahunAkademik.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada tahun akademik</p>
          </div>
        )}

        {tahunAkademik.map((ta, i) => (
          <div key={ta.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold text-foreground flex items-center gap-2">
                  {ta.tahun}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(ta.status)}`}>
                    {getStatusLabel(ta.status)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {ta.tanggal_mulai} s/d {ta.tanggal_selesai}
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openEdit(ta)} 
                  className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"
                >
                  <Pencil size={18} />
                </button>
                <button 
                  onClick={() => setDeleteId(ta.id)} 
                  className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button className="app-fab" onClick={openAdd}>
        <Plus size={24} />
      </button>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit' : 'Tambah'} Tahun Akademik</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tahun <span className="text-destructive">*</span></Label>
              <Input 
                className="rounded-xl" 
                placeholder="2026/2027"
                value={form.tahun} 
                onChange={e => setForm({ ...form, tahun: e.target.value })} 
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Mulai <span className="text-destructive">*</span></Label>
              <Input 
                type="date"
                className="rounded-xl" 
                value={form.tanggal_mulai} 
                onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} 
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal Selesai <span className="text-destructive">*</span></Label>
              <Input 
                type="date"
                className="rounded-xl" 
                value={form.tanggal_selesai} 
                onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })} 
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status <span className="text-destructive">*</span></Label>
              <Select 
                value={form.status} 
                onValueChange={(v: any) => setForm({ ...form, status: v })} 
                disabled={submitting}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
              {form.status === 'aktif' && (
                <p className="text-xs text-muted-foreground">
                  ⚠️ Mengaktifkan tahun akademik ini akan menonaktifkan tahun akademik aktif lainnya
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl" 
                onClick={() => setDialogOpen(false)} 
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                className="flex-1 rounded-xl" 
                onClick={handleSave} 
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[85vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tahun Akademik?</AlertDialogTitle>
            <AlertDialogDescription>
              Data tahun akademik akan dihapus permanen. Tindakan ini tidak dapat dibatalkan!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-xl bg-destructive hover:bg-destructive/90" 
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
