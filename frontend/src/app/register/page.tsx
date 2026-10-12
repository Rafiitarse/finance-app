'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useRegister } from '@/hooks/useApi';
import { toastError } from '@/hooks/useToast';

const registerSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter').max(30),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  password_confirm: z.string(),
  first_name: z.string().min(1, 'Nama depan wajib diisi'),
  last_name: z.string().optional(),
}).refine((data) => data.password === data.password_confirm, {
  message: 'Password tidak cocok',
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  
  const registerMutation = useRegister();
  
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync(data);
      router.push('/dashboard');
      router.refresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string; username?: string[]; email?: string[]; password?: string[] } } };
      if (err.response?.data?.password) {
        // Show backend password validation errors under the password field
        const passwordErrors = Array.isArray(err.response.data.password)
          ? err.response.data.password.join(', ')
          : err.response.data.password;
        setError('password', { type: 'server', message: passwordErrors });
      } else if (err.response?.data?.username) {
        setError('username', { type: 'server', message: err.response.data.username[0] });
      } else if (err.response?.data?.email) {
        setError('email', { type: 'server', message: err.response.data.email[0] });
      } else {
        toastError(err.response?.data?.detail || 'Terjadi kesalahan saat mendaftar');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-bold text-primary-600">FinanceApp</span>
          </Link>
          <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
          <CardDescription>Mulai kelola keuangan Anda hari ini</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nama Depan"
                placeholder="Budi"
                error={errors.first_name?.message}
                {...register('first_name')}
              />
              <Input
                label="Nama Belakang"
                placeholder="Santoso"
                {...register('last_name')}
              />
            </div>
            
            <Input
              label="Username"
              placeholder="budisantoso"
              error={errors.username?.message}
              {...register('username')}
            />
            
            <Input
              label="Email"
              type="email"
              placeholder="budi@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[35px] text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <Input
              label="Konfirmasi Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              error={errors.password_confirm?.message}
              {...register('password_confirm')}
            />
            
            <Button
              type="submit"
              className="w-full"
              loading={registerMutation.isPending}
            >
              <Loader2 className="w-4 h-4" />
              Daftar
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-primary-600 hover:underline font-medium">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
