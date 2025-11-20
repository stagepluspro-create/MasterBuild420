import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from './lib/supabase-server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/static') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const publicRoutes = ['/', '/auth/signin', '/auth/signup', '/auth/reset-password', '/paypal/success'];
  if (publicRoutes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  try {
    const supabase = getServerSupabase();

    const token = req.cookies.get('sb-access-token')?.value || req.cookies.get('sb:token')?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/signin';
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (_e) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next|static|favicon.ico).*)'],
};
