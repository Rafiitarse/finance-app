import { NextResponse, type NextRequest } from 'next/server';

import { clearAuthCookies, refreshTokens, setAuthCookies, backendFetch } from '@/lib/server-api';

/**
 * Catch-all proxy: every non-auth API call goes through here so the access
 * token (HttpOnly cookie) can be attached server-side. On a 401 the refresh
 * token is rotated and the original request is retried once.
 */
async function proxy(request: NextRequest, rawPath: string): Promise<NextResponse> {
  // Django endpoints all use trailing slashes (DRF convention). Next.js
  // canonicalizes trailing slashes with a 308, so normalize here: always send
  // the backend a path that ends with exactly one '/'.
  const path = `/${rawPath.replace(/^\/+/, '').replace(/\/+$/, '')}/`;
  const access = request.cookies.get('access_token')?.value;
  const refresh = request.cookies.get('refresh_token')?.value;
  const search = request.nextUrl.search;

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }
  let upstream = await backendFetch(path, {
    method: request.method,
    token: access,
    search,
    body: body ? JSON.parse(body) : undefined,
  });

  let newTokens: { access: string; refresh: string } | null = null;
  if (upstream.status === 401 && refresh) {
    newTokens = await refreshTokens(refresh);
    if (newTokens) {
      upstream = await backendFetch(path, {
        method: request.method,
        token: newTokens.access,
        search,
        body: body ? JSON.parse(body) : undefined,
      });
    }
  }

  const payload = await upstream.arrayBuffer();
  const response = new NextResponse(payload, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
    },
  });

  if (newTokens) {
    setAuthCookies(response.cookies, newTokens);
  } else if (upstream.status === 401 && !newTokens) {
    // Refresh failed (or no refresh cookie): the session is dead.
    clearAuthCookies(response.cookies);
  }

  return response;
}

type RouteContext = { params: { path: string[] } };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return proxy(request, `/${params.path.join('/')}`);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return proxy(request, `/${params.path.join('/')}`);
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  return proxy(request, `/${params.path.join('/')}`);
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  return proxy(request, `/${params.path.join('/')}`);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  return proxy(request, `/${params.path.join('/')}`);
}
