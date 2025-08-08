import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create a fallback client for build time
const createSupabaseServer = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    // Return a mock client for build time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null })
      },
      from: () => ({
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) })
      })
    } as any
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export const supabaseServer = createSupabaseServer()

// Client-side Supabase client (for API routes that need it)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for build time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null })
      },
      from: () => ({
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: null }) }) }),
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) })
      })
    } as any
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabaseClient = createSupabaseClient()
