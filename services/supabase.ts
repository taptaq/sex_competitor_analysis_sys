import { createClient } from '@supabase/supabase-js';

// Load from env, or use placeholders that user must replace
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing! Please check .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
