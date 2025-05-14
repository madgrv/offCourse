// Supabase client instance for use throughout the app
// Reads project URL and anon key from environment variables for security and flexibility

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Explicitly configure auth for robust Next.js support
// - persistSession: keeps user logged in across reloads
// - autoRefreshToken: refreshes JWT automatically
// - storage: use browser localStorage only (avoids SSR/session issues)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
