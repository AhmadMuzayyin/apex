'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, User, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { masterDataService } from '@/services/masterDataService';
import { firestoreService } from '@/services/firestoreService';
import type { Siswa, User as UserType } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';

export default function StudentProfil() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [siswaData, setSiswaData] = useState<Siswa | null>(null);
  const [userData, setUserData] = useState<UserType | null>(null);
  
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    no_induk: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user?.siswaId) return;
      
      // Load siswa data
      const siswa = await masterDataService.getSiswaById(user.siswaId);
      setSiswaData(siswa);
      
      // Load user data
      const users = await firestoreService.getAll<UserType>('users');
      const currentUser = users.find(u => u.id === user.id);
      setUserData(currentUser || null);
      
      if (siswa) {
        setFormData({
          nama_lengkap: siswa.nama_lengkap,
          no_induk: siswa.no_induk,
          password: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Validasi
      if (!formData.nama_lengkap.trim()) {
        toast({
          title: 'Error',
          description: 'Nama lengkap tidak boleh kosong',
          variant: 'destructive',
        });
        return;
      }

      // Validasi password jika diisi
      if (formData.password) {
        if (formData.password.length < 6) {
          toast({
            title: 'Error',
            description: 'Password minimal 6 karakter',
            variant: 'destructive',
          });
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            title: 'Error',
            description: 'Password dan konfirmasi password tidak sama',
            variant: 'destructive',
          });
          return;
        }
      }

      setSaving(true);

      // Update siswa data
      if (siswaData) {
        await masterDataService.updateSiswa(siswaData.id, {
          nama_lengkap: formData.nama_lengkap,
          updated_at: new Date().toISOString(),
        });
      }

      // Update user data (password) if password changed
      if (formData.password && userData) {
        // Hash password (simple hash for demo - in production use proper bcrypt)
        const passwordHash = btoa(formData.password); // Simple base64 encoding
        
        await firestoreService.update<UserType>('users', userData.id, {
          password_hash: passwordHash,
          updated_at: new Date().toISOString(),
        });
      }

      // Update localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.nama = formData.nama_lengkap;
        localStorage.setItem('currentUser', JSON.stringify(parsed));
      }

      toast({
        title: 'Berhasil',
        description: 'Profil berhasil diperbarui',
      });

      // Reload data
      await loadData();
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan profil',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="app-topbar">
        <button onClick={() => router.back()} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1>Profil Saya</h1>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Info Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{siswaData?.nama_lengkap}</p>
              <p className="text-sm text-muted-foreground font-mono">{siswaData?.no_induk}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
            <div>
              <p className="text-muted-foreground">Role</p>
              <p className="font-medium capitalize">Siswa</p>
            </div>
            <div>
              <p className="text-muted-foreground">Angkatan</p>
              <p className="font-medium">{siswaData?.angkatan}</p>
            </div>
          </div>
        </Card>

        {/* Form Update */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Update Profil</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="no_induk">No Induk</Label>
              <Input
                id="no_induk"
                value={formData.no_induk}
                disabled
                className="rounded-xl bg-muted"
              />
              <p className="text-xs text-muted-foreground">No induk tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
              <Input
                id="nama_lengkap"
                value={formData.nama_lengkap}
                onChange={(e) => handleChange('nama_lengkap', e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="rounded-xl"
              />
            </div>
          </div>
        </Card>

        {/* Form Password */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Lock className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Ubah Password</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password Baru</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  className="rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimal 6 karakter</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Ulangi password baru"
                  className="rounded-xl pr-10"
                  disabled={!formData.password}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={!formData.password}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl h-12 text-base font-semibold"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Simpan Perubahan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
