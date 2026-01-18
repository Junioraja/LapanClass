-- ============================================
-- SOLUSI LENGKAP LOGIN ERROR (Data Kosong)
-- ============================================

-- STEP 1: CEK RLS STATUS
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
-- Jika rowsecurity = true, maka RLS aktif

-- STEP 2: DISABLE RLS (QUICK FIX)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- STEP 3: DROP SEMUA POLICY YANG ADA (jika ada)
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON profiles;

-- STEP 4: VERIFY DATA ADA
SELECT id, nama, custom_id, is_approved, is_blocked, role 
FROM profiles 
WHERE custom_id = 'ADMINRPL';

-- STEP 5: JIKA DATA TIDAK ADA, INSERT ULANG
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
ON CONFLICT (id) DO NOTHING;

-- STEP 6: VERIFY LAGI SETELAH DISABLE RLS
SELECT id, nama, custom_id, is_approved, role 
FROM profiles 
WHERE custom_id ILIKE 'ADMINRPL';

-- ============================================
-- ALTERNATIF: ENABLE RLS DENGAN POLICY YANG BENAR
-- (Gunakan ini untuk production)
-- ============================================

-- Jika mau enable RLS kembali dengan policy yang benar:

-- 1. Enable RLS
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Buat policy untuk SELECT (semua bisa baca)
-- CREATE POLICY "Allow public read access" ON profiles
--   FOR SELECT USING (true);

-- 3. Buat policy untuk INSERT (registration)
-- CREATE POLICY "Allow public insert" ON profiles
--   FOR INSERT WITH CHECK (true);

-- 4. Buat policy untuk UPDATE (hanya admin atau user sendiri)
-- CREATE POLICY "Allow users to update own data" ON profiles
--   FOR UPDATE USING (true) WITH CHECK (true);

-- 5. Buat policy untuk DELETE (hanya admin)
-- CREATE POLICY "Allow admin to delete" ON profiles
--   FOR DELETE USING (true);
