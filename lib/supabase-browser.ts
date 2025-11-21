 * Supabase Browser Client
 *
 * This creates a Supabase client for use in CLIENT COMPONENTS ONLY.
 *
 * Usage:
 *   import { createClient } from '@/lib/supabase-browser'
 *   const supabase = createClient()
 *
 * NOTE: For server components, use lib/supabase-server.ts instead!
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
