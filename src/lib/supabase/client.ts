import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Type definition for Supabase client (optional but helpful for DB interactions)
// import { Database } from '@/types_db'; 

// Create a Supabase client for client components.
// It automatically reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
export const supabase = createClientComponentClient();
// If using DB types: export const supabase = createClientComponentClient<Database>(); 