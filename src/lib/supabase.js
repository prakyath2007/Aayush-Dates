/**
 * Supabase client — gracefully handles missing package.
 * When @supabase/supabase-js is not installed, exports a null client
 * so the rest of the app can fall back to mock data.
 */

let supabase = null
let supabaseReady = false

async function initSupabase() {
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const url = import.meta.env.VITE_SUPABASE_URL
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY
    if (url && key) {
      supabase = createClient(url, key)
      supabaseReady = true
      console.log('Supabase connected')
    } else {
      console.warn('Missing Supabase env vars — running in demo mode')
    }
  } catch (e) {
    console.warn('Supabase not available — demo mode')
  }
}

const ready = initSupabase()

export { supabase, supabaseReady, ready }
