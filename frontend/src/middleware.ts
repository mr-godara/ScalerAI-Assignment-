import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // We use a simple cookie or we can just check local storage on client side.
  // Since Zustand persist uses localStorage, we can't easily read it here.
  // We'll let the client handle redirects for this mock auth if we don't use cookies.
  // BUT the prompt requested middleware.ts with route protection.
  // So we will assume a cookie 'auth-token' might exist, or we just do a basic check.
  // For standard mock, we'll check cookies for 'auth-token'.
  
  const token = request.cookies.get('auth-token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');

  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/hosted-zones', request.url));
  }
  
  if (request.nextUrl.pathname === '/') {
     return NextResponse.redirect(new URL(token ? '/hosted-zones' : '/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
