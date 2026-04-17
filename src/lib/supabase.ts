import { createClient } from '@supabase/supabase-js'

// Colocando as chaves diretamente para a Vercel não quebrar o build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bekjfcjlywgrsfqkakfn.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_GdYDi1FKgtsdbb3HIHxpIA_Jm2y1HFA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
