'use client';

import { ReactNode } from 'react';
import { QueryProvider } from '@/lib/queryProvider';
import { Toaster } from '@/components/ui/Toaster';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  );
}
