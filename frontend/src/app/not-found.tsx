'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MainLayout } from '@/components/layout/MainLayout';

export default function NotFound() {
  return (
    <MainLayout>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 px-6">
            <div className="mx-auto mb-6 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">404</h1>
            <p className="text-gray-500 mb-6">Halaman tidak ditemukan</p>
            <p className="text-sm text-gray-400 mb-8">
              Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.history.back()}>
                <Home className="w-4 h-4 mr-2" />
                Kembali
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                Ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
