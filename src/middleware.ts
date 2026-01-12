import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // Cache static assets aggressively
  const url = request.nextUrl.pathname
  if (
    url.startsWith('/_next/static') ||
    url.startsWith('/images') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.gif') ||
    url.endsWith('.webp') ||
    url.endsWith('.svg') ||
    url.endsWith('.ico')
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
  }

  // Cache API responses for a short time
  if (url.startsWith('/api/')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=120'
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth endpoints)
     * - _next/webpack-hmr (dev hot reload)
     */
    '/((?!api/auth|_next/webpack-hmr).*)',
  ],
}
