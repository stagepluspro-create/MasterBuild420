'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

export async function signIn(email: string, password: string, redirectTo: string = '/dashboard') {
  // Sanitize redirect to prevent open redirect attacks - only allow same-origin relative paths
  let safeRedirect = '/dashboard'
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    safeRedirect = redirectTo
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message, success: false }
  }

  if (!data.session) {
    return { error: 'No session created', success: false }
  }

  // Explicitly set the session to ensure cookies are written
  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })

  return { success: true, redirectTo: safeRedirect }
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()
  
  // Get the origin from headers for secure email redirect
  const headersList = await headers()
  const origin = headersList.get('origin') || headersList.get('referer')?.split('/').slice(0, 3).join('/') || process.env.NEXT_PUBLIC_SITE_URL || ''
  
  if (!origin) {
    return { error: 'Could not determine site URL for email verification', success: false }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message, success: false }
  }

  // If email confirmation is required, show a message instead of redirecting
  if (data.user && !data.session) {
    return { 
      success: true, 
      requiresEmailConfirmation: true,
      message: 'Please check your email to confirm your account before signing in.'
    }
  }

  // If session exists (auto-confirm is enabled), set it and redirect
  if (data.session) {
    await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    return { success: true, redirectTo: '/dashboard' }
  }

  return { error: 'Unexpected signup response', success: false }
}
