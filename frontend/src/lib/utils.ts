import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function getMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function getMonthOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];
}

export function getYearOptions(): { value: number; label: string }[] {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push({ value: i, label: i.toString() });
  }
  return years;
}

export const TRANSACTION_TYPE_LABELS: Record<'income' | 'expense', string> = {
  income: 'Pemasukan',
  expense: 'Pengeluaran',
};

export const TRANSACTION_TYPE_COLORS: Record<'income' | 'expense', string> = {
  income: 'text-income-600 bg-income-50',
  expense: 'text-expense-600 bg-expense-50',
};

/**
 * Validates a callback URL to prevent open redirects.
 * Only allows relative paths starting with a single '/', not '//' or '/\\'.
 * Returns '/dashboard' for invalid or empty inputs.
 */
export function safeCallbackUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return '/dashboard';
  }
  // Must start with a single '/'
  if (!url.startsWith('/')) {
    return '/dashboard';
  }
  // Must not start with '//' or '/\\'
  if (url.startsWith('//') || url.startsWith('/\\')) {
    return '/dashboard';
  }
  return url;
}
