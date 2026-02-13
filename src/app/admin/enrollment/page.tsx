'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TahunAkademik, Kelompok } from '@/types/firestore';

interface Enrollment {
  id: string;
  tahun_akademik_id: string;
  siswa_id: string;
  kelompok_id: string;
  status: string;
  tanggal_daftar: string;
  siswa: {
    id: string;
    no_induk: string;
    nama_lengkap: string;
    angkatan: number;
  } | null;
  kelompok: {
    id: string;
    kode: string;
    nama_kelompok: string;
  } | null;
}

export default function EnrollmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [kelompok, setKelompok] = useState<Kelompok[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    nama_lengkap: '',
    kelompok_id: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadEnrollments();
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

      // Load kelompok
      const { masterDataService } = await import('@/services/masterDataService');
      const kelompokData = await masterDataService.getAllKelompok();
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

  const loadEnrollments = async () => {
    try {
      const res = await fetch(`/api/enrollment?tahun_akademik_id=${selectedTahunAkademik}`);
      const data = await res.json();
      
      if (data.success) {
        setEnrollments(data.data);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data enrollment',
        variant: 'destructive',
      });
    }
  };

  const handleEnroll = async () => {
    if (!form.nama_lengkap || !form.kelompok_id) {
      toast({
        title: 'Validasi Error',
        description: 'Semua field harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: form.nama_lengkap,
          kelompok_id: form.kelompok_id,
          tahun_akademik_id: selectedTahunAkademik,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast({
        title: 'Sukses',
        description: `Siswa berhasil didaftarkan dengan No Induk: ${data.data.no_induk}`,
        duration: 5000,
      });

      setDialogOpen(false);
      setForm({ nama_lengkap: '', kelompok_id: '' });
      loadEnrollments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mendaftarkan siswa',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTA = tahunAkademik.find(ta => ta.id === selectedTahunAkademik);

  if (loading) {
    return (
      <div>
        <div className="app-topbar">
          <button onClick={() => router.push('/admin/data')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Enrollment Siswa</h1>
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
        <h1>Enrollment Siswa</h1>
        <span className="ml-auto text-sm opacity-80">{enrollments.length} siswa</span>
      </div>

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
          {selectedTA && (
            <div className="mt-2 text-xs text-muted-foreground">
              {selectedTA.tanggal_mulai} s/d {selectedTA.tanggal_selesai}
            </div>
          )}
        </div>

        {/* List Enrollments */}
        {enrollments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Belum ada siswa yang terdaftar</p>
          </div>
        )}

        {enrollments.map((enrollment, i) => (
          <div key={enrollment.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-foreground">
                  {enrollment.siswa?.nama_lengkap || '-'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {enrollment.siswa?.no_induk || '-'} • {enrollment.kelompok?.nama_kelompok || '-'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Angkatan {enrollment.siswa?.angkatan || '-'}
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                enrollment.status === 'aktif' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {enrollment.status}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button 
        className="app-fab" 
        onClick={() => setDialogOpen(true)}
        disabled={!selectedTahunAkademik}
      >
        <UserPlus size={24} />
      </button>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Daftar Siswa Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
              <Input 
                className="rounded-xl" 
                value={form.nama_lengkap} 
                onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} 
                disabled={submitting}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Kelompok <span className="text-destructive">*</span></Label>
              <Select 
                value={form.kelompok_id} 
                onValueChange={v => setForm({ ...form, kelompok_id: v })} 
                disabled={submitting}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Pilih Kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {kelompok.map(k => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama_kelompok} (Kode: {k.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTA && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>Info:</strong> Siswa akan didaftarkan untuk tahun akademik {selectedTA.tahun}.
                No induk akan dibuat otomatis dengan format: {selectedTA.tahun.split('/')[0]}[Kode Kelompok][Nomor Urut]
              </div>
            )}
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
                onClick={handleEnroll} 
                disabled={submitting}
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Daftar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
