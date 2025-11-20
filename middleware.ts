import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public pages
  const publicRoutes = [
    '/',
    '/auth',
    '/auth/signin',
    '/auth/signup',
    '/auth/reset-password',
    '/auth/update-password',
    '/paypal',
    '/paypal/success',
  ];

  const isPublic = publicRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Don’t block API or static
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Allow public pages without checking auth
  if (isPublic) {
    return NextResponse.next();
  }

  // You can adjust cookie names later
  const accessToken =
    req.cookies.get('sb-access-token')?.value ||
    req.cookies.get('sb:token')?.value;

  // If user not logged in → redirect to sign in
  if (!accessToken) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/auth/signin';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
};
