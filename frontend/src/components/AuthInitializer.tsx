'use client';

import { useEffect } from 'react';
import { getAccessToken, getRefreshToken } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useUser } from '@/hooks/useApi';

export function AuthInitializer() {
  const { user, isAuthenticated, logout, setLoading } = useAuthStore();
  const { refetch } = useUser();

  useEffect(() => {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    // If neither cookie exists, reset the store immediately
    if (!accessToken && !refreshToken) {
      if (isAuthenticated || user) {
        logout();
      }
      setLoading(false);
      return;
    }

    // If we have cookies but no user data yet, validate with the server
    if (isAuthenticated && !user) {
      refetch();
    } else if (!isAuthenticated && (accessToken || refreshToken)) {
      // Cookies exist but store says not authenticated - this shouldn't happen
      // but we handle it by setting loading to trigger validation
      setLoading(true);
      refetch();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user, logout, setLoading, refetch]); // Run on mount and when auth state changes

  return null;
}