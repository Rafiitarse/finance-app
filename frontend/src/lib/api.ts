import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import type { AuthTokens, AuthResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const getAccessToken = (): string | undefined => Cookies.get(ACCESS_TOKEN_KEY);
export const getRefreshToken = (): string | undefined => Cookies.get(REFRESH_TOKEN_KEY);

export const setTokens = (tokens: AuthTokens): void => {
  const cookieOptions = {
    expires: 1/24, // 1 hour
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  };
  const refreshCookieOptions = {
    ...cookieOptions,
    expires: 7, // 7 days
  };
  Cookies.set(ACCESS_TOKEN_KEY, tokens.access, cookieOptions);
  Cookies.set(REFRESH_TOKEN_KEY, tokens.refresh, refreshCookieOptions);
};

export const clearTokens = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// Request interceptor - add auth header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
};

// Auth endpoints: a 401 from these is a real credential error, not an expired
// access token, so the refresh flow must be skipped and the original error
// forwarded to the caller.
const AUTH_NO_REFRESH_ENDPOINTS = ['/auth/login/', '/auth/register/', '/auth/refresh/'];

const isAuthEndpoint = (url?: string): boolean =>
  !!url && AUTH_NO_REFRESH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      if (isRefreshing) {
        // Wait for refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post<AuthTokens>(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access, refresh } = response.data;
        setTokens({ access, refresh });
        
        processQueue(null, access);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        clearTokens();
        // Redirect to login if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login/', { email, password }),
  
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name?: string;
  }) => api.post<AuthResponse>('/auth/register/', data),
  
  me: () => api.get<AuthResponse['user']>('/auth/me/'),
  
  logout: (refresh: string) =>
    api.post('/auth/logout/', { refresh }),
  
  refresh: (refresh: string) =>
    api.post<AuthTokens>('/auth/refresh/', { refresh }),
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
