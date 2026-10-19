import { describe, expect, it } from 'vitest';
import { safeCallbackUrl, formatCurrency, getMonthYear, getCurrentMonthYear, TRANSACTION_TYPE_LABELS } from './utils';

describe('safeCallbackUrl', () => {
  it('allows normal relative paths', () => {
    expect(safeCallbackUrl('/dashboard')).toBe('/dashboard');
    expect(safeCallbackUrl('/transactions?page=2')).toBe('/transactions?page=2');
  });

  it('falls back for null, undefined and empty input', () => {
    expect(safeCallbackUrl(null)).toBe('/dashboard');
    expect(safeCallbackUrl(undefined)).toBe('/dashboard');
    expect(safeCallbackUrl('')).toBe('/dashboard');
  });

  it('rejects protocol-relative URLs (//evil.com)', () => {
    expect(safeCallbackUrl('//evil.com')).toBe('/dashboard');
  });

  it('rejects backslash tricks (/\\evil)', () => {
    expect(safeCallbackUrl('/\\evil.com')).toBe('/dashboard');
  });

  it('rejects control characters that browsers strip (tab/CR/LF)', () => {
    expect(safeCallbackUrl('/\tevil.example')).toBe('/dashboard');
    expect(safeCallbackUrl('/\revil.example')).toBe('/dashboard');
    expect(safeCallbackUrl('/\nevil.example')).toBe('/dashboard');
  });

  it('rejects absolute URLs pointing to another origin', () => {
    expect(safeCallbackUrl('http://evil.com/steal')).toBe('/dashboard');
    expect(safeCallbackUrl('https://evil.com')).toBe('/dashboard');
  });

  it('keeps the path, search and hash of valid relative URLs', () => {
    expect(safeCallbackUrl('/dashboard?tab=summary#top')).toBe('/dashboard?tab=summary#top');
  });
});

describe('formatCurrency', () => {
  it('formats string amounts as IDR without decimals', () => {
    expect(formatCurrency('50000')).toContain('50.000');
    expect(formatCurrency('50000')).toContain('Rp');
  });

  it('formats numeric amounts', () => {
    expect(formatCurrency(1250000)).toContain('1.250.000');
  });
});

describe('getMonthYear', () => {
  it('formats month names in Indonesian with zero-padded months', () => {
    expect(getMonthYear(2026, 1)).toBe('Januari 2026');
    expect(getMonthYear(2026, 9)).toBe('September 2026');
    expect(getMonthYear(2026, 12)).toBe('Desember 2026');
  });
});

describe('getCurrentMonthYear', () => {
  it('returns the current local month and year', () => {
    const now = new Date();
    expect(getCurrentMonthYear()).toEqual({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
  });
});

describe('TRANSACTION_TYPE_LABELS', () => {
  it('maps both transaction types to Indonesian labels', () => {
    expect(TRANSACTION_TYPE_LABELS.income).toBe('Pemasukan');
    expect(TRANSACTION_TYPE_LABELS.expense).toBe('Pengeluaran');
  });
});
