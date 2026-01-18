import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cek apakah variabel terbaca
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("EROR: Variabel Supabase tidak ditemukan di .env.local!");
  console.log("Cek file .env.local Anda di root project.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
)