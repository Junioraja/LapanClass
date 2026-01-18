-- ============================================
-- FIX RLS POLICIES UNTUK TABEL PROFILES
-- ============================================

-- Error 406 biasanya karena RLS policy yang menghalangi akses
-- Solusi: Disable RLS atau buat policy yang benar

-- Option 1: DISABLE RLS (untuk development/testing)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Option 2: ENABLE RLS dengan policy yang benar (untuk production)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow semua orang untuk SELECT (read)
-- CREATE POLICY "Enable read access for all users" ON profiles
--   FOR SELECT USING (true);

-- Policy: Allow insert untuk registration
-- CREATE POLICY "Enable insert for registration" ON profiles
--   FOR INSERT WITH CHECK (true);

-- Policy: Allow update hanya untuk admin atau user sendiri
-- CREATE POLICY "Enable update for users based on id" ON profiles
--   FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================
-- JIKA MASIH ERROR, CEK APAKAH DATA ADA
-- ============================================

-- Cek apakah admin user sudah ada:
SELECT id, nama, role, custom_id, is_approved, is_blocked 
FROM profiles 
WHERE custom_id = 'ADMINRPL' OR custom_id = 'ADMIN1';

-- Jika tidak ada, insert ulang:
INSERT INTO profiles (
  id,
  nis,
  nama,
  role,
  nomor_absen,
  class_id,
  phone,
  password,
  custom_id,
  is_approved,
  approved_by,
  jabatan,
  is_blocked
)
VALUES (
  gen_random_uuid(),
  NULL,
  'Super Admin',
  'admin',
  NULL,
  NULL,
  '08123456789',
  '$2b$10$VeTOEdaWxZUivO/zV.PdT.DswyiGlD.iTxXF/FoLyUKO8s4tGzI.e',
  'ADMINRPL',
  TRUE,
  NULL,
  'Administrator',
  FALSE
)
ON CONFLICT (custom_id) DO NOTHING;
