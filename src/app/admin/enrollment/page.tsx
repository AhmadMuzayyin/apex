'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Loader2, Edit, Trash2, QrCode, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [kelompok, setKelompok] = useState<Kelompok[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState<string>('');
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    nama_lengkap: '',
    kelompok_id: '',
  });

  const [editForm, setEditForm] = useState<{
    enrollment_id: string;
    siswa_id: string;
    nama_lengkap: string;
    kelompok_id: string;
  } | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<{
    siswa_id: string;
    nama: string;
  } | null>(null);

  const [qrData, setQrData] = useState<{
    no_induk: string;
    nama: string;
    kelompok: string;
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadEnrollments(selectedTahunAkademik);
    }
  }, [selectedTahunAkademik]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [taRes, kelRes] = await Promise.all([
        fetch('/api/tahun-akademik'),
        fetch('/api/kelompok'),
      ]);

      const taData = await taRes.json();
      const kelData = await kelRes.json();

      if (taData.success) {
        setTahunAkademik(taData.data);

        // Set active tahun akademik as default
        const activeTa = taData.data.find((ta: TahunAkademik) => ta.status === 'aktif');
        if (activeTa) {
          setSelectedTahunAkademik(activeTa.id);
        }
      }

      if (kelData.success) {
        setKelompok(kelData.data);
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

  const loadEnrollments = async (tahunAkademikId: string) => {
    try {
      setLoadingEnrollments(true);
      const res = await fetch(`/api/enrollment?tahun_akademik_id=${tahunAkademikId}`);
      const data = await res.json();
      
      if (data.success) {
        setEnrollments(data.data || []);
      } else {
        setEnrollments([]);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat data enrollment',
        variant: 'destructive',
      });
      setEnrollments([]);
    } finally {
      setLoadingEnrollments(false);
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
      loadEnrollments(selectedTahunAkademik);
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

  const handleEdit = (enrollment: Enrollment) => {
    if (!enrollment.siswa) return;
    
    setEditForm({
      enrollment_id: enrollment.id,
      siswa_id: enrollment.siswa_id,
      nama_lengkap: enrollment.siswa.nama_lengkap,
      kelompok_id: enrollment.kelompok_id,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateEnrollment = async () => {
    if (!editForm) return;

    setSubmitting(true);
    try {
      // Update siswa nama
      const siswaRes = await fetch(`/api/siswa/${editForm.siswa_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_lengkap: editForm.nama_lengkap,
        }),
      });

      if (!siswaRes.ok) throw new Error('Gagal update siswa');

      // Update enrollment kelompok
      const enrollRes = await fetch(`/api/enrollment/${editForm.enrollment_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelompok_id: editForm.kelompok_id,
        }),
      });

      if (!enrollRes.ok) throw new Error('Gagal update enrollment');

      toast({
        title: 'Sukses',
        description: 'Data siswa berhasil diupdate',
      });

      setEditDialogOpen(false);
      setEditForm(null);
      loadEnrollments(selectedTahunAkademik);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal update data',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (enrollment: Enrollment) => {
    if (!enrollment.siswa) return;
    
    setDeleteTarget({
      siswa_id: enrollment.siswa_id,
      nama: enrollment.siswa.nama_lengkap,
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/siswa/${deleteTarget.siswa_id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      toast({
        title: 'Sukses',
        description: 'Siswa dan semua data terkait berhasil dihapus',
      });

      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      loadEnrollments(selectedTahunAkademik);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus data',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateQR = async (enrollment: Enrollment) => {
    if (!enrollment.siswa) return;

    setQrData({
      no_induk: enrollment.siswa.no_induk,
      nama: enrollment.siswa.nama_lengkap,
      kelompok: enrollment.kelompok?.nama_kelompok || '-',
    });
    setQrDialogOpen(true);

    // Generate QR code
    setTimeout(async () => {
      if (qrCanvasRef.current) {
        try {
          await QRCode.toCanvas(qrCanvasRef.current, enrollment.siswa!.no_induk, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });
        } catch (error) {
          console.error('QR generation error:', error);
        }
      }
    }, 100);
  };

  const handleDownloadQR = () => {
    if (!qrCanvasRef.current || !qrData) return;

    const canvas = qrCanvasRef.current;
    const link = document.createElement('a');
    // Format: QR_NoInduk_NamaSiswa.png (replace spaces with underscore)
    const filename = `QR_${qrData.no_induk}_${qrData.nama.replace(/\s+/g, '_')}.png`;
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleExportExcel = () => {
    if (enrollments.length === 0) {
      toast({
        title: 'Info',
        description: 'Tidak ada data siswa untuk diexport',
      });
      return;
    }

    const rows = enrollments.map((enrollment, index) => ({
      no: index + 1,
      'no induk': enrollment.siswa?.no_induk || '-',
      nama: enrollment.siswa?.nama_lengkap || '-',
      kelompok: enrollment.kelompok?.nama_kelompok || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');

    const namaTahunAkademik = selectedTA?.tahun ? selectedTA.tahun.replace(/[^a-zA-Z0-9-_]/g, '_') : 'semua';
    const fileName = `enrollment_siswa_${namaTahunAkademik}.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
        <div className="flex justify-end">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={handleExportExcel}
            disabled={enrollments.length === 0}
          >
            <Download size={16} className="mr-2" />
            Export Excel
          </Button>
        </div>

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
        {loadingEnrollments && selectedTahunAkademik && (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="app-card animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  <div className="h-8 bg-muted rounded-xl" />
                  <div className="h-8 bg-muted rounded-xl" />
                  <div className="h-8 bg-muted rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingEnrollments && enrollments.length === 0 && selectedTahunAkademik && (
          <div className="text-center py-12 text-muted-foreground">
            <UserPlus size={48} className="mx-auto mb-4 opacity-20" />
            <p>Belum ada siswa yang terdaftar</p>
            <p className="text-xs mt-1">Klik tombol + untuk menambah siswa</p>
          </div>
        )}

        {!loadingEnrollments && enrollments.map((enrollment, i) => (
          <div key={enrollment.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="font-semibold text-foreground">
                  {enrollment.siswa?.nama_lengkap || '-'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {enrollment.siswa?.no_induk || '-'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {enrollment.kelompok?.nama_kelompok || '-'} • Angkatan {enrollment.siswa?.angkatan || '-'}
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

            {/* Action Buttons */}
            <div className="flex gap-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => handleGenerateQR(enrollment)}
              >
                <QrCode size={16} className="mr-2" />
                QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                onClick={() => handleEdit(enrollment)}
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl text-destructive hover:bg-destructive hover:text-white"
                onClick={() => handleDeleteClick(enrollment)}
              >
                <Trash2 size={16} className="mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB - Add New */}
      <button 
        className="app-fab" 
        onClick={() => setDialogOpen(true)}
        disabled={!selectedTahunAkademik}
      >
        <UserPlus size={24} />
      </button>

      {/* Dialog - Add New Enrollment */}
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
            <div className="bg-blue-50 p-3 rounded-xl text-sm text-blue-800">
              <strong>Info:</strong> No Induk akan digenerate otomatis dengan format: {selectedTA?.tahun || 'YYYY'}[Kode][Urut]
            </div>
            <div className="flex gap-2">
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
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Daftar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Edit Enrollment */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Siswa</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nama Lengkap <span className="text-destructive">*</span></Label>
                <Input 
                  className="rounded-xl" 
                  value={editForm.nama_lengkap} 
                  onChange={e => setEditForm({ ...editForm, nama_lengkap: e.target.value })} 
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Kelompok <span className="text-destructive">*</span></Label>
                <Select 
                  value={editForm.kelompok_id} 
                  onValueChange={v => setEditForm({ ...editForm, kelompok_id: v })} 
                  disabled={submitting}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleUpdateEnrollment}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Simpan
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog - Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Hapus Siswa</DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Anda yakin ingin menghapus siswa <strong>{deleteTarget.nama}</strong>?
              </p>
              <div className="bg-red-50 p-3 rounded-xl text-sm text-red-800">
                <strong>Peringatan:</strong> Tindakan ini akan menghapus SEMUA data terkait siswa:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Data master siswa</li>
                  <li>Semua enrollment (history semua tahun akademik)</li>
                  <li>Semua nilai (harian & ulangan)</li>
                  <li>Semua absensi</li>
                  <li>Semua jam tambahan</li>
                  <li>Semua prestasi</li>
                  <li>Akun user siswa</li>
                </ul>
                <p className="mt-2 font-semibold">Data yang terhapus TIDAK BISA dikembalikan!</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={handleDeleteConfirm}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Hapus Permanen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog - QR Code */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>QR Code - ID Card Siswa</DialogTitle>
          </DialogHeader>
          {qrData && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="font-semibold text-lg">{qrData.nama}</div>
                <div className="text-sm text-muted-foreground">{qrData.no_induk}</div>
                <div className="text-xs text-muted-foreground">{qrData.kelompok}</div>
              </div>
              
              <div className="flex justify-center bg-white p-4 rounded-xl">
                <canvas ref={qrCanvasRef} />
              </div>

              <div className="text-xs text-center text-muted-foreground">
                Scan QR code ini untuk absensi siswa
              </div>

              <Button
                className="w-full rounded-xl"
                onClick={handleDownloadQR}
              >
                <Download size={16} className="mr-2" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
