'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, EyeOff, User, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/services/firestoreService';
import type { User as UserType } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminProfil() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [userData, setUserData] = useState<UserType | null>(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    code: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      if (!user?.id) return;
      
      // Load user data
      const users = await firestoreService.getAll<UserType>('users');
      const currentUser = users.find(u => u.id === user.id);
      setUserData(currentUser || null);
      
      setFormData({
        nama: currentUser?.nama || '',
        code: currentUser?.code || '',
        password: '',
        confirmPassword: '',
      });
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
      if (!formData.nama.trim()) {
        toast({
          title: 'Error',
          description: 'Nama tidak boleh kosong',
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

      if (!userData) return;

      // Build update data
      const updateData: Partial<UserType> = {
        nama: formData.nama,
        updated_at: new Date().toISOString(),
      };

      // Add password if changed
      if (formData.password) {
        // Hash password (simple hash for demo - in production use proper bcrypt)
        const passwordHash = btoa(formData.password); // Simple base64 encoding
        updateData.password_hash = passwordHash;
      }

      await firestoreService.update<UserType>('users', userData.id, updateData);

      // Update localStorage
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.nama = formData.nama;
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
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg">{userData?.nama}</p>
              <p className="text-sm text-muted-foreground font-mono">{userData?.code}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
            <div>
              <p className="text-muted-foreground">Role</p>
              <Badge variant="default" className="mt-1">
                Administrator
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Last Login</p>
              <p className="font-medium text-xs mt-1">
                {userData?.last_login 
                  ? new Date(userData.last_login).toLocaleDateString('id-ID', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '-'
                }
              </p>
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
              <Label htmlFor="code">Username</Label>
              <Input
                id="code"
                value={formData.code}
                disabled
                className="rounded-xl bg-muted"
              />
              <p className="text-xs text-muted-foreground">Username tidak dapat diubah</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nama">Nama Lengkap</Label>
              <Input
                id="nama"
                value={formData.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
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
