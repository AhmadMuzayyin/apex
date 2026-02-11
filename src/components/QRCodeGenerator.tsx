'use client';

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Siswa } from '@/types/firestore';

interface QRCodeGeneratorProps {
  siswa: Siswa;
  open: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({ siswa, open, onClose }: QRCodeGeneratorProps) {
  const [downloading, setDownloading] = useState(false);

  // QR Code data (JSON format)
  const qrData = JSON.stringify({
    no_induk: siswa.no_induk,
    type: 'student_absensi',
  });

  const handleDownload = () => {
    setDownloading(true);
    try {
      const canvas = document.getElementById(`qr-canvas-${siswa.id}`) as HTMLCanvasElement;
      if (!canvas) return;

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_${siswa.no_induk}_${siswa.nama_lengkap}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code Absensi</DialogTitle>
          <DialogDescription>
            QR Code untuk {siswa.nama_lengkap}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border">
            <QRCodeCanvas
              id={`qr-canvas-${siswa.id}`}
              value={qrData}
              size={256}
              level="H"
              includeMargin={true}
            />
            
            <div className="mt-4 text-center space-y-1">
              <div className="font-bold text-lg text-gray-900">{siswa.nama_lengkap}</div>
              <div className="text-sm text-gray-600">No Induk: {siswa.no_induk}</div>
              <div className="text-xs text-gray-500">Scan untuk absensi</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1"
              variant="default"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
            
            <Button
              onClick={handlePrint}
              className="flex-1"
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Cara Pakai:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Download atau print QR code ini</li>
              <li>Tempel di kartu siswa</li>
              <li>Scan saat absensi di kelas</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
