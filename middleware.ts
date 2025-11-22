import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isAuthPage = pathname.startsWith('/auth')

  // Routes that require authentication only (no subscription check)
  const isAuthOnlyRoute =
    pathname.startsWith('/profile') ||
    pathname.startsWith('/teams') ||
    pathname === '/paypal' ||
    pathname.startsWith('/paypal/success')

  // Routes that require active subscription or trial
  const requiresSubscription =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/tools/')

  // Check authentication first
  if (!user && (isAuthOnlyRoute || requiresSubscription)) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check subscription status for protected tool routes
  if (user && requiresSubscription) {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    const hasActiveSubscription =
      subscription?.status === 'active' ||
      (subscription?.status === 'trial' && new Date(subscription.trial_end) > new Date())

    if (!hasActiveSubscription) {
      // Redirect to pricing page if subscription is inactive/expired
      const redirectUrl = new URL('/#pricing', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (user && isAuthPage && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
