/**
 * Server-side helpers for the BFF (backend-for-frontend) auth layer.
 * These run only in Next.js route handlers — never in the browser.
 */

const BACKEND_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000/api';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  };
}

export function setAuthCookies(
  cookies: {
    set: (name: string, value: string, options: Record<string, unknown>) => void;
  },
  tokens: { access: string; refresh: string },
): void {
  cookies.set(ACCESS_COOKIE, tokens.access, cookieOptions(60 * 60)); // 1 hour
  cookies.set(REFRESH_COOKIE, tokens.refresh, cookieOptions(7 * 24 * 60 * 60)); // 7 days
}

export function clearAuthCookies(
  cookies: {
    delete: (name: string) => void;
  },
): void {
  cookies.delete(ACCESS_COOKIE);
  cookies.delete(REFRESH_COOKIE);
}

interface BackendFetchOptions {
  method?: string;
  body?: unknown;
  token?: string | undefined;
  search?: string;
}

/** Call the Django backend from the server. Never exposes tokens to the client. */
export async function backendFetch(
  path: string,
  { method = 'GET', body, token, search = '' }: BackendFetchOptions = {},
): Promise<Response> {
  return fetch(`${BACKEND_URL}${path}${search}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
}

/** Exchange a refresh token for a new token pair. Returns null when it fails. */
export async function refreshTokens(
  refresh: string,
): Promise<{ access: string; refresh: string } | null> {
  try {
    const res = await backendFetch('/auth/refresh/', { method: 'POST', body: { refresh } });
    if (!res.ok) return null;
    const data = (await res.json()) as { access: string; refresh: string };
    if (!data.access || !data.refresh) return null;
    return data;
  } catch {
    return null;
  }
}
