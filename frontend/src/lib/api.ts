import axios from 'axios';
import type { AuthTokens, AuthResponse } from '@/types';

// All API calls go through the Next.js BFF:
// - `api`  → /api/backend/* (catch-all proxy; the access token is attached
//            server-side from the HttpOnly cookie and refreshed automatically)
// - `authApi` → /api/auth/* (dedicated route handlers that manage cookies)
// The client NEVER sees or handles tokens.
export const api = axios.create({
  baseURL: '/api/backend',
  headers: {
    'Content-Type': 'application/json',
  },
});

const authAxios = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API — route handlers under /api/auth/*
export const authApi = {
  login: (email: string, password: string) =>
    authAxios.post<{ user: AuthResponse['user'] }>('/api/auth/login', { email, password }),

  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name?: string;
  }) => authAxios.post<{ user: AuthResponse['user'] }>('/api/auth/register', data),

  me: () => authAxios.get<AuthResponse['user']>('/api/auth/me'),

  updateMe: (data: Partial<Pick<AuthResponse['user'], 'first_name' | 'last_name' | 'username' | 'email'>>) =>
    authAxios.patch<AuthResponse['user']>('/api/auth/me', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    authAxios.post<{ detail: string }>('/api/auth/change-password', data),

  deleteMe: (data: { password: string }) =>
    authAxios.delete('/api/auth/me', { data }),

  logout: () => authAxios.post('/api/auth/logout'),
};

// Categories API
export const categoriesApi = {
  list: (params?: { type?: string }) =>
    api.get<Category[]>('/categories/', { params }),

  create: (data: CategoryFormData) =>
    api.post<Category>('/categories/', data),

  get: (id: number) =>
    api.get<Category>(`/categories/${id}/`),

  update: (id: number, data: Partial<CategoryFormData>) =>
    api.patch<Category>(`/categories/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/categories/${id}/`),

  summary: (params?: SummaryFilters) =>
    api.get<CategorySummary[]>('/categories/summary/', { params }),
};

// Transactions API
export const transactionsApi = {
  list: (params?: TransactionFilters) =>
    api.get<PaginatedResponse<Transaction>>('/transactions/', { params }),

  trend: (params?: { months?: number; year?: number; month?: number }) =>
    api.get<MonthlyTrendItem[]>('/transactions/trend/', { params }),

  create: (data: TransactionFormData) =>
    api.post<Transaction>('/transactions/', data),

  get: (id: number) =>
    api.get<Transaction>(`/transactions/${id}/`),

  update: (id: number, data: Partial<TransactionFormData>) =>
    api.patch<Transaction>(`/transactions/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/transactions/${id}/`),

  summary: (params?: SummaryFilters) =>
    api.get<MonthlySummary>('/transactions/summary/', { params }),
};

// Types for API functions
import type { Category, Transaction, CategoryFormData, TransactionFormData, TransactionFilters, SummaryFilters, PaginatedResponse, CategorySummary, MonthlySummary, MonthlyTrendItem } from '@/types';

// AuthTokens is kept for the route handler response shapes (server-side only).
export type { AuthTokens };
