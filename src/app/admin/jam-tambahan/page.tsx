'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Edit2, Save, Loader2 } from 'lucide-react';
import { masterDataService } from '@/services/masterDataService';
import type { JamTambahan, Tahap, Materi, Siswa, Kelompok, TahunAkademik } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function JamTambahanPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tahunAkademik, setTahunAkademik] = useState<TahunAkademik[]>([]);
  const [selectedTahunAkademik, setSelectedTahunAkademik] = useState('');
  const [jamTambahanList, setJamTambahanList] = useState<JamTambahan[]>([]);
  const [tahaps, setTahaps] = useState<Tahap[]>([]);
  const [materis, setMateris] = useState<Materi[]>([]);
  const [siswas, setSiswas] = useState<Siswa[]>([]);
  const [kelompoks, setKelompoks] = useState<Kelompok[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<JamTambahan | null>(null);
  const [form, setForm] = useState({ 
    jumlah_menit: 60, 
    status: 'pending' as 'pending' | 'selesai', 
    keterangan: '', 
    nilai_tambahan: 0 
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTahunAkademik();
  }, []);

  useEffect(() => {
    if (selectedTahunAkademik) {
      loadData();
    }
  }, [selectedTahunAkademik]);

  const loadTahunAkademik = async () => {
    try {
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
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat tahun akademik',
        variant: 'destructive',
      });
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [jtData, tahapData, materiData, kelompokData, enrollmentRes] = await Promise.all([
        masterDataService.getAllJamTambahan(),
        masterDataService.getAllTahap(),
        masterDataService.getAllMateri(),
        masterDataService.getAllKelompok(),
        fetch(`/api/enrollment?tahun_akademik_id=${selectedTahunAkademik}`)
      ]);

      // Filter tahap by tahun akademik
      const filteredTahap = tahapData.filter(t => t.tahun_akademik_id === selectedTahunAkademik);
      
      // Filter jam tambahan by tahun akademik (via tahap)
      const tahapIds = filteredTahap.map(t => t.id);
      const filteredJT = jtData.filter(jt => tahapIds.includes(jt.tahap_id));

      // Get enrolled siswa for this tahun akademik
      const enrollmentData = await enrollmentRes.json();
      let enrolledSiswa: Siswa[] = [];
      if (enrollmentData.success) {
        enrolledSiswa = enrollmentData.data
          .filter((e: any) => e.siswa)
          .map((e: any) => e.siswa);
      }

      setJamTambahanList(filteredJT);
      setTahaps(filteredTahap);
      setMateris(materiData);
      setSiswas(enrolledSiswa);
      setKelompoks(kelompokData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedTahunAkademik, toast]);

  const getTahapName = (id: string) => tahaps.find(t => t.id === id)?.nama_tahap || '-';
  const getMateriName = (id: string) => materis.find(m => m.id === id)?.nama_materi || '-';
  const getSiswaName = (id: string) => siswas.find(s => s.id === id)?.nama_lengkap || '-';
  const getSiswaNomorInduk = (id: string) => siswas.find(s => s.id === id)?.no_induk || '-';

  const openInput = (jt: JamTambahan) => {
    setSelected(jt);
    setForm({ 
      jumlah_menit: jt.jumlah_menit, 
      status: jt.status, 
      keterangan: jt.keterangan || '',
      nilai_tambahan: jt.nilai_tambahan || 0
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    
    setSaving(true);
    try {
      await masterDataService.updateJamTambahan(selected.id, {
        ...selected,
        jumlah_menit: form.jumlah_menit,
        status: form.status,
        keterangan: form.keterangan,
        nilai_tambahan: form.nilai_tambahan,
        updated_at: new Date().toISOString()
      });
      
      toast({
        title: 'Berhasil',
        description: 'Jam tambahan berhasil disimpan',
      });
      
      setDialogOpen(false);
      await loadData();
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan jam tambahan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const pendingList = jamTambahanList.filter(jt => jt.status === 'pending');
  const selesaiList = jamTambahanList.filter(jt => jt.status === 'selesai');

  if (loading) {
    return (
      <div className="pb-20">
        <div className="app-topbar">
          <button onClick={() => router.push('/admin')} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1>Jam Tambahan</h1>
        </div>
        <div className="app-content flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <div className="app-topbar">
        <button onClick={() => router.push('/admin')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1>Jam Tambahan</h1>
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
        </div>

        {selectedTahunAkademik && (
          <>
            {jamTambahanList.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">🎉 Semua siswa lulus KKM</p>
                <p className="text-sm mt-1">Tidak ada siswa yang memerlukan jam tambahan</p>
              </div>
            )}

            {pendingList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-warning">
              <AlertCircle size={16} /> Pending ({pendingList.length})
            </div>
            {pendingList.map((jt, i) => (
              <div key={jt.id} className="app-card animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-foreground">{getSiswaName(jt.siswa_id)}</div>
                    <div className="text-xs text-muted-foreground">{getSiswaNomorInduk(jt.siswa_id)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getTahapName(jt.tahap_id)} • {getMateriName(jt.materi_id)}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span>Nilai Awal: <span className="font-semibold text-destructive">{jt.nilai_awal.toFixed(1)}</span></span>
                      {jt.nilai_tambahan && jt.nilai_tambahan > 0 && (
                        <span>Nilai JT: <span className="font-semibold text-primary">{jt.nilai_tambahan}</span></span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span className="badge-pill bg-warning/10 text-warning">
                        <Clock size={10} className="mr-1" /> {jt.jumlah_menit} menit
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => openInput(jt)}>
                    <Edit2 size={14} className="mr-1" /> Input
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {selesaiList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle size={16} /> Selesai ({selesaiList.length})
            </div>
            {selesaiList.map((jt, i) => (
              <div key={jt.id} className="app-card animate-fade-in opacity-80" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold text-foreground">{getSiswaName(jt.siswa_id)}</div>
                    <div className="text-xs text-muted-foreground">{getSiswaNomorInduk(jt.siswa_id)}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getTahapName(jt.tahap_id)} • {getMateriName(jt.materi_id)}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <span>Nilai Awal: <span className="text-muted-foreground">{jt.nilai_awal.toFixed(1)}</span></span>
                      <span>Nilai JT: <span className="font-semibold text-primary">{jt.nilai_tambahan || 0}</span></span>
                    </div>
                    <div className="mt-1">
                      <span className="badge-pill bg-success/10 text-success">
                        <CheckCircle size={10} className="mr-1" /> Selesai • {jt.jumlah_menit} menit
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => openInput(jt)}>
                    <Edit2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader><DialogTitle>Input Jam Tambahan</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="p-3 bg-accent/50 rounded-xl text-sm">
                <div className="font-semibold">{getSiswaName(selected.siswa_id)}</div>
                <div className="text-muted-foreground">
                  {getTahapName(selected.tahap_id)} • {getMateriName(selected.materi_id)}
                </div>
                <div className="text-muted-foreground">Nilai awal: {selected.nilai_awal.toFixed(1)}</div>
              </div>
              
              <div className="space-y-1.5">
                <Label>Nilai Jam Tambahan</Label>
                <Input 
                  className="rounded-xl" 
                  type="number" 
                  min={0} 
                  max={100} 
                  value={form.nilai_tambahan} 
                  onChange={e => setForm({ ...form, nilai_tambahan: Math.min(100, Math.max(0, Number(e.target.value))) })} 
                />
                <p className="text-xs text-muted-foreground">Nilai ini akan ditambahkan ke rata-rata nilai harian</p>
              </div>
              
              <div className="space-y-1.5">
                <Label>Jumlah Jam (menit)</Label>
                <Input 
                  className="rounded-xl" 
                  type="number" 
                  min={0} 
                  value={form.jumlah_menit} 
                  onChange={e => setForm({ ...form, jumlah_menit: Number(e.target.value) })} 
                />
              </div>
              
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as 'pending' | 'selesai' })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label>Keterangan</Label>
                <Input 
                  className="rounded-xl" 
                  value={form.keterangan} 
                  onChange={e => setForm({ ...form, keterangan: e.target.value })} 
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl" 
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Batal
                </Button>
                <Button 
                  className="flex-1 rounded-xl" 
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" /> Simpan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
          </>
        )}
      </div>
    </div>
  );
}
