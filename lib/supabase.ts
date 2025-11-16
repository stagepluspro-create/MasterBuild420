import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    console.error('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
    console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
    throw new Error(
      'Missing Supabase environment variables. Please check your .env file.'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'stagetechpro-auth-token',
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'stagetechpro'
      }
    }
  });

  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});
