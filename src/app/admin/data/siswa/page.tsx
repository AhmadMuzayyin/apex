'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { masterDataService } from '@/services/masterDataService';
import type { Siswa, Kelompok } from '@/types/firestore';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';

export default function DataSiswa() {
  const router = useRouter();
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelompok, setKelompok] = useState<Kelompok[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Siswa | null>(null);
  const [form, setForm] = useState({ no_induk: '', nama_lengkap: '', angkatan: 2024 });
  const [submitting, setSubmitting] = useState(false);
  const [qrSiswa, setQrSiswa] = useState<Siswa | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [siswaData, kelompokData] = await Promise.all([
        masterDataService.getAllSiswa(),
        masterDataService.getAllKelompok()
      ]);
      setSiswa(siswaData);
      setKelompok(kelompokData);
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
    setForm({ no_induk: '', nama_lengkap: '', angkatan: 2024 });
    setEditItem(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Siswa) => {
    setForm({ no_induk: s.no_induk, nama_lengkap: s.nama_lengkap, angkatan: s.angkatan });
    setEditItem(s);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.no_induk || !form.nama_lengkap) {
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
        // Update siswa
        await masterDataService.updateSiswa(editItem.id, form);
        
        // Update user account (nama)
        const { firestoreService } = await import('@/services/firestoreService');
        const users = await firestoreService.getAll<any>('users', {
          filters: [{ field: 'siswa_id', operator: '==', value: editItem.id }]
        });
        
        if (users.length > 0) {
          await firestoreService.update('users', users[0].id, {
            nama: form.nama_lengkap,
            code: form.no_induk,
            updated_at: new Date().toISOString(),
          });
        }
        
        toast({ title: 'Sukses', description: 'Siswa berhasil diupdate' });
      } else {
        // Create siswa
        const newSiswaId = await masterDataService.createSiswa(form as any);
        
        // Auto-create user account with default password
        const { firestoreService } = await import('@/services/firestoreService');
        const bcrypt = await import('bcryptjs');
        const defaultPassword = 'password';
        const passwordHash = await bcrypt.hash(defaultPassword, 10);
        
        await firestoreService.create('users', {
          code: form.no_induk,
          role: 'siswa',
          password_hash: passwordHash,
          siswa_id: newSiswaId,
          nama: form.nama_lengkap,
          created_at: new Date().toISOString(),
        });
        
        toast({ 
          title: 'Sukses', 
          description: 'Siswa berhasil ditambahkan. Password default: "password"',
          duration: 5000,
        });
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
      // Call server-side API to handle cascade delete
      const response = await fetch(`/api/siswa/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Gagal menghapus data');
      }
      
      toast({ 
        title: 'Sukses', 
        description: 'Siswa dan semua data terkait berhasil dihapus',
        duration: 5000,
      });
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

  const getKelompokName = (id: string) => kelompok.find(k => k.id === id)?.nama_kelompok || '-';

  if (loading) {
    return (
      <div>
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/data')} className="p-1"><ArrowLeft size={22} /></button>
          <h1>Data Siswa</h1>
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
        <h1>Data Siswa</h1>
        <span className="ml-auto text-sm opacity-80">{siswa.length} data</span>
      </div>
      <div className="app-content p-4 space-y-3">
        {siswa.length === 0 && <div className="text-center py-12 text-muted-foreground"><p>Belum ada data siswa</p></div>}
        {siswa.map((s, i) => (
          <div key={s.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-foreground">{s.nama_lengkap}</div>
                <div className="text-sm text-muted-foreground">{s.no_induk}</div>
                <div className="text-xs text-muted-foreground">Angkatan {s.angkatan}</div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setQrSiswa(s)} 
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Generate QR Code"
                >
                  <QrCode size={18} />
                </button>
                <button onClick={() => openEdit(s)} className="p-2 rounded-lg text-primary hover:bg-accent transition-colors"><Pencil size={18} /></button>
                <button onClick={() => setDeleteId(s.id)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="app-fab" onClick={openAdd}><Plus size={24} /></button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>{editItem ? 'Edit' : 'Tambah'} Siswa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nomor Induk <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" value={form.no_induk} onChange={e => setForm({ ...form, no_induk: e.target.value })} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label>Angkatan <span className="text-destructive">*</span></Label>
              <Input className="rounded-xl" type="number" value={form.angkatan} onChange={e => setForm({ ...form, angkatan: Number(e.target.value) })} disabled={submitting} />
              <p className="text-xs text-muted-foreground">Note: Gunakan halaman Enrollment untuk mendaftarkan siswa ke kelompok & tahun akademik</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDialogOpen(false)} disabled={submitting}>Batal</Button>
              <Button className="flex-1 rounded-xl" onClick={handleSave} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-[85vw] rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Siswa?</AlertDialogTitle>
            <AlertDialogDescription>
              Data siswa akan dihapus permanen beserta SEMUA data terkait:
              <br />• Akun login
              <br />• Nilai harian & ulangan
              <br />• Absensi
              <br />• Jam tambahan
              <br />• Prestasi
              <br /><br />
              <strong>Tindakan ini tidak dapat dibatalkan!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {qrSiswa && (
        <QRCodeGenerator
          siswa={qrSiswa}
          open={!!qrSiswa}
          onClose={() => setQrSiswa(null)}
        />
      )}
    </div>
  );
}
