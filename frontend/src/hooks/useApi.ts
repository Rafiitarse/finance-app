import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { authApi, categoriesApi, transactionsApi, setTokens, getRefreshToken, clearTokens } from '@/lib/api';
import type { Category, Transaction, CategoryFormData, TransactionFormData, TransactionFilters, SummaryFilters } from '@/types';
import { useAuthStore } from '@/lib/store';

// Auth Hooks
export function useLogin() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => 
      authApi.login(email, password),
    onSuccess: (data) => {
      const { access, refresh, user } = data.data;
      setTokens({ access, refresh });
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useRegister() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      username: string;
      email: string;
      password: string;
      password_confirm: string;
      first_name: string;
      last_name?: string;
    }) => authApi.register(data),
    onSuccess: (data) => {
      const { access, refresh, user } = data.data;
      setTokens({ access, refresh });
      setUser(user);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refresh = getRefreshToken();
      if (refresh) {
        await authApi.logout(refresh);
      }
    },
    onSuccess: () => {
      // Server logout succeeded
    },
    onError: () => {
      // Swallow server/network errors - we still clear locally
    },
    onSettled: () => {
      // Always clear local state regardless of server outcome
      clearTokens();
      logout();
      queryClient.clear();
    },
  });
}

export function useUser() {
  const { user, isAuthenticated, setUser, setLoading } = useAuthStore();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['user'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated && !user,
    retry: false,
  });

  // Replace onSuccess/onError (removed in TanStack Query v5)
  useEffect(() => {
    if (data) {
      setUser(data.data);
    }
  }, [data, setUser]);

  useEffect(() => {
    if (error) {
      setUser(null);
      setLoading(false);
    }
  }, [error, setUser, setLoading]);

  return { user: user || data?.data, isLoading: isLoading || user === null && isAuthenticated, error, refetch };
}

// Category Hooks
export function useCategories(type?: 'income' | 'expense') {
  return useQuery({
    queryKey: ['categories', type],
    queryFn: () => categoriesApi.list({ type }),
    select: (data) => data.data.results,
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: ['category', id],
    queryFn: () => categoriesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoryFormData) => categoriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryFormData> }) => 
      categoriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useCategorySummary() {
  return useQuery({
    queryKey: ['category-summary'],
    queryFn: () => categoriesApi.summary(),
  });
}

// Transaction Hooks
export function useTransactions(filters?: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionsApi.list(filters),
    select: (data) => data.data,
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => transactionsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransactionFormData) => transactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-summary'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TransactionFormData> }) => 
      transactionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-summary'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['category-summary'] });
    },
  });
}

export function useTransactionSummary(filters?: SummaryFilters) {
  return useQuery({
    queryKey: ['transaction-summary', filters],
    queryFn: () => transactionsApi.summary(filters),
  });
}
