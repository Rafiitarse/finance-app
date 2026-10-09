'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Bell, Save, Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuthStore } from '@/lib/store';
import { toastSuccess, toastError } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  first_name: z.string().min(1, 'Nama depan wajib diisi'),
  last_name: z.string().optional(),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Password saat ini wajib diisi'),
  new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Password baru tidak cocok',
  path: ['confirm_password'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      username: user?.username || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    // In a real app, call API to update profile
    console.log('Update profile:', data);
    toastSuccess('Profil berhasil diperbarui');
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    // In a real app, call API to change password
    console.log('Change password:', data);
    toastSuccess('Password berhasil diubah');
    passwordForm.reset();
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-500">Kelola akun dan preferensi Anda</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'profile', label: 'Profil', icon: User },
            { id: 'password', label: 'Keamanan', icon: Lock },
            { id: 'notifications', label: 'Notifikasi', icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>Kelola informasi akun Anda</CardDescription>
            </CardHeader>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nama Depan"
                  error={profileForm.formState.errors.first_name?.message}
                  {...profileForm.register('first_name')}
                />
                <Input
                  label="Nama Belakang"
                  {...profileForm.register('last_name')}
                />
              </div>
              <Input
                label="Username"
                error={profileForm.formState.errors.username?.message}
                {...profileForm.register('username')}
              />
              <Input
                label="Email"
                type="email"
                error={profileForm.formState.errors.email?.message}
                {...profileForm.register('email')}
              />
              <CardFooter>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>Pastikan password Anda kuat dan unik</CardDescription>
            </CardHeader>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="p-6 space-y-4">
              <div className="relative">
                <Input
                  label="Password Saat Ini"
                  type={showCurrentPassword ? 'text' : 'password'}
                  error={passwordForm.formState.errors.current_password?.message}
                  {...passwordForm.register('current_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-[35px] text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="Password Baru"
                  type={showNewPassword ? 'text' : 'password'}
                  error={passwordForm.formState.errors.new_password?.message}
                  {...passwordForm.register('new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-[35px] text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="relative">
                <Input
                  label="Konfirmasi Password Baru"
                  type={showConfirmPassword ? 'text' : 'password'}
                  error={passwordForm.formState.errors.confirm_password?.message}
                  {...passwordForm.register('confirm_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[35px] text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <CardFooter>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Ubah Password
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Notifikasi</CardTitle>
              <CardDescription>Kelola notifikasi yang Anda terima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { id: 'email_transactions', label: 'Notifikasi Transaksi Email', desc: 'Kirim email untuk setiap transaksi baru' },
                { id: 'email_weekly', label: 'Ringkasan Mingguan', desc: 'Kirim ringkasan keuangan setiap minggu' },
                { id: 'email_monthly', label: 'Ringkasan Bulanan', desc: 'Kirim ringkasan keuangan setiap bulan' },
                { id: 'push_budget', label: 'Peringatan Anggaran', desc: 'Notifikasi saat mendekati batas anggaran' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <button
                    className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors"
                    role="switch"
                    aria-checked={false}
                  >
                    <span className="inline-block h-4 w-4 transform bg-white rounded-full transition-transform" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Zona Bahaya
            </CardTitle>
            <CardDescription>Tindakan yang tidak bisa dibatalkan</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between p-4 border-t border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Hapus Akun</p>
                <p className="text-sm text-gray-500">Menghapus akun dan semua data Anda secara permanen</p>
              </div>
              <Button variant="danger">Hapus Akun</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
