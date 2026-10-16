'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { useLogin } from '@/hooks/useApi';
import { toastError } from '@/hooks/useToast';
import { Suspense } from 'react';
import { safeCallbackUrl } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'));
  const [showPassword, setShowPassword] = useState(false);
  
  const loginMutation = useLogin();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);
      router.push(callbackUrl);
      router.refresh();
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { detail?: string } } };
      if (err.response?.status === 401) {
        toastError('Email atau password salah');
      } else {
        toastError(err.response?.data?.detail || 'Gagal masuk. Silakan coba lagi.');
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
          <CardTitle className="text-2xl">Masuk ke Akun</CardTitle>
          <CardDescription>Masuk untuk mengelola keuangan Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="anda@email.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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
            
            <Button
              type="submit"
              className="w-full"
              loading={loginMutation.isPending}
            >
              <Loader2 className="w-4 h-4" />
              Masuk
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-center text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="text-primary-600 hover:underline font-medium">
              Daftar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50" />}>
      <LoginForm />
    </Suspense>
  );
}
