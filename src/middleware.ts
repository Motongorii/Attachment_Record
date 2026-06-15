import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  // If no session and trying to access protected routes
  if (!session && (isDashboardPage || isAdminPage)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If session exists and trying to access login page
  if (session && isLoginPage) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If student trying to access admin page
  if (session && session.role === 'student' && isAdminPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/admin/:path*'],
};
