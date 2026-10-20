'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useUser } from '@/hooks/useApi';

export function AuthInitializer() {
  const { setLoading } = useAuthStore();
  const { isLoading } = useUser();

  // The session is validated by useUser against /api/auth/me (401 when the
  // HttpOnly cookies are gone or invalid). Stop the loading state once the
  // validation settles.
  useEffect(() => {
    if (!isLoading) setLoading(false);
  }, [isLoading, setLoading]);

  return null;
}
