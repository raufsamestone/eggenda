import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const createClientComponentClient = () => {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    },
  });

  return supabaseClient;
}; 