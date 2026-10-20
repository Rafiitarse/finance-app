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
 * POST /api/auth/change-password — proxies to Django with the access cookie,
 * stores the NEW token pair Django returns (all old refresh tokens were
 * blacklisted server-side). Tokens never reach the client.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }

  const access = readCookie(request, ACCESS_COOKIE);
  const refresh = readCookie(request, REFRESH_COOKIE);

  let upstream = await backendFetch('/auth/change-password/', {
    method: 'POST',
    token: access,
    body,
  });

  if (upstream.status === 401 && refresh) {
    const newTokens = await refreshTokens(refresh);
    if (newTokens) {
      upstream = await backendFetch('/auth/change-password/', {
        method: 'POST',
        token: newTokens.access,
        body,
      });
    }
  }

  const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;

  if (!upstream.ok) {
    const response = NextResponse.json(data, { status: upstream.status });
    if (upstream.status === 401) clearAuthCookies(response.cookies);
    return response;
  }

  const response = NextResponse.json({ detail: 'Password changed successfully.' });
  setAuthCookies(response.cookies, {
    access: data.access as string,
    refresh: data.refresh as string,
  });
  return response;
}

function readCookie(request: Request, name: string): string | undefined {
  const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}
