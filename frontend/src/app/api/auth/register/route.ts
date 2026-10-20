import { NextResponse } from 'next/server';

import { backendFetch, setAuthCookies } from '@/lib/server-api';

/**
 * POST /api/auth/register — proxies to Django and stores the token pair in
 * HttpOnly cookies (auto-login after registration).
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid request body.' }, { status: 400 });
  }

  const upstream = await backendFetch('/auth/register/', { method: 'POST', body });
  const data = (await upstream.json().catch(() => ({}))) as Record<string, unknown>;

  if (!upstream.ok) {
    return NextResponse.json(data, { status: upstream.status });
  }

  const response = NextResponse.json({ user: data.user }, { status: 201 });
  setAuthCookies(response.cookies, {
    access: data.access as string,
    refresh: data.refresh as string,
  });
  return response;
}
