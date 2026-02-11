'use client';

import { useState, useEffect } from 'react';
import { Save, X, Award, User, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Siswa } from '@/types/firestore';

interface NilaiInputModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (nilai: number, keterangan: string) => Promise<void>;
  siswa: Siswa | null;
  pertemuanKe: number;
  materiNama: string;
  existingNilai?: { nilai: number; keterangan: string } | null;
}

export function NilaiInputModal({
  open,
  onClose,
  onSave,
  siswa,
  pertemuanKe,
  materiNama,
  existingNilai,
}: NilaiInputModalProps) {
  const [nilai, setNilai] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset or pre-fill form when modal opens
  useEffect(() => {
    if (open) {
      if (existingNilai) {
        // Pre-fill dengan nilai yang sudah ada
        setNilai(existingNilai.nilai);
        setKeterangan(existingNilai.keterangan);
      } else {
        // Reset untuk input baru
        setNilai(0);
        setKeterangan('');
      }
    }
  }, [open, siswa?.id, existingNilai]);

  const handleSave = async () => {
    if (nilai < 0 || nilai > 100) {
      return;
    }

    setSaving(true);
    try {
      await onSave(nilai, keterangan);
      onClose();
    } catch (error) {
      console.error('Error saving nilai:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nilai >= 0 && nilai <= 100) {
      handleSave();
    }
  };

  if (!siswa) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {existingNilai ? 'Update Nilai Harian' : 'Input Nilai Harian'}
          </DialogTitle>
          <DialogDescription>
            {materiNama} - Pertemuan ke-{pertemuanKe}
            {existingNilai && (
              <span className="block text-amber-600 mt-1">
                ⚠️ Nilai sudah ada, akan di-update
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Siswa Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold">{siswa.nama_lengkap}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Hash className="h-4 w-4" />
              <span className="font-mono">{siswa.no_induk}</span>
            </div>
            <Badge variant="secondary">
              Pertemuan ke-{pertemuanKe}
            </Badge>
          </div>

          {/* Input Nilai */}
          <div className="space-y-2">
            <Label htmlFor="nilai">
              Nilai <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nilai"
              type="number"
              min="0"
              max="100"
              value={nilai || ''}
              onChange={(e) => setNilai(Number(e.target.value))}
              onKeyPress={handleKeyPress}
              placeholder="0-100"
              className="text-2xl font-bold text-center"
              autoFocus
            />
            {(nilai < 0 || nilai > 100) && (
              <p className="text-xs text-destructive">
                Nilai harus antara 0-100
              </p>
            )}
          </div>

          {/* Input Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan (opsional)</Label>
            <Input
              id="keterangan"
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Catatan tambahan..."
              maxLength={100}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            <X className="h-4 w-4 mr-2" />
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || nilai < 0 || nilai > 100}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : existingNilai ? 'Update' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
