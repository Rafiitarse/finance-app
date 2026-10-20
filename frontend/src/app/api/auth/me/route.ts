import { NextResponse } from 'next/server';

import {
  clearAuthCookies,
  refreshTokens,
  setAuthCookies,
  backendFetch,
  ACCESS_COOKIE,
  REFRESH_COOKIE,
} from '@/lib/server-api';

/**
 * GET/PATCH/DELETE /api/auth/me — proxies to Django with the HttpOnly access
 * cookie attached server-side; refreshes once on 401. DELETE clears cookies
 * because the account (and its tokens) no longer exists.
 */
async function callMe(
  request: Request,
  method: string,
  body?: unknown,
): Promise<{ status: number; data: unknown; newTokens: { access: string; refresh: string } | null }> {
  const access = readCookie(request, ACCESS_COOKIE);
  const refresh = readCookie(request, REFRESH_COOKIE);

  let upstream = await backendFetch('/auth/me/', { method, token: access, body });
  let newTokens: { access: string; refresh: string } | null = null;

  if (upstream.status === 401 && refresh) {
    newTokens = await refreshTokens(refresh);
    if (newTokens) {
      upstream = await backendFetch('/auth/me/', {
        method,
        token: newTokens.access,
        body,
      });
    }
  }

  const data = (await upstream.json().catch(() => null)) as unknown;
  return { status: upstream.status, data, newTokens };
}

function readCookie(request: Request, name: string): string | undefined {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { status, data, newTokens } = await callMe(request, 'GET');
  const response = NextResponse.json(data ?? {}, { status });
  if (newTokens) setAuthCookies(response.cookies, newTokens);
  if (status === 401) clearAuthCookies(response.cookies);
  return response;
}

export async function PATCH(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }
  const { status, data, newTokens } = await callMe(request, 'PATCH', body);
  const response = NextResponse.json(data ?? {}, { status });
  if (newTokens) setAuthCookies(response.cookies, newTokens);
  if (status === 401) clearAuthCookies(response.cookies);
  return response;
}

export async function DELETE(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }
  const { status, data, newTokens } = await callMe(request, 'DELETE', body);
  if (status === 401) {
    const response = NextResponse.json(data ?? {}, { status });
    clearAuthCookies(response.cookies);
    return response;
  }
  if (status >= 200 && status < 300) {
    // Account deleted — cookies must go too.
    return new NextResponse(null, { status: 204 });
  }
  const response = NextResponse.json(data ?? {}, { status });
  if (newTokens) setAuthCookies(response.cookies, newTokens);
  return response;
}
