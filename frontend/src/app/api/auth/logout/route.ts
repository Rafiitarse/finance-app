import { NextResponse } from 'next/server';

import { backendFetch, clearAuthCookies } from '@/lib/server-api';

/**
 * POST /api/auth/logout — best-effort server-side logout, then always clears
 * the HttpOnly cookies so the client session really ends.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const refresh = request.headers.get('cookie')?.match(/refresh_token=([^;]+)/)?.[1];

  if (refresh) {
    try {
      await backendFetch('/auth/logout/', {
        method: 'POST',
        body: { refresh: decodeURIComponent(refresh) },
      });
    } catch {
      // Swallow — local cleanup still happens below.
    }
  }

  const response = NextResponse.json({ detail: 'Successfully logged out.' });
  clearAuthCookies(response.cookies);
  return response;
}
