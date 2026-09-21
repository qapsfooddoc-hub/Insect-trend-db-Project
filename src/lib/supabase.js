import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Use Service Role / Secret Key for server-side API routes (bypasses RLS), fallback to Anon Key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Initialize the Supabase Client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Helper to check if Supabase is properly configured with real credentials
 */
export function isSupabaseConfigured() {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseKey) &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseKey.includes('your-anon-key')
  );
}
