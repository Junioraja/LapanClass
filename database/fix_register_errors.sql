-- ============================================
-- FIX REGISTER ERRORS
-- ============================================

-- ERROR 1: Fix enum user_role
-- Tambahkan 'ketua_kelas' ke enum jika belum ada

-- Cek enum yang ada
SELECT enum_range(NULL::user_role);

-- Tambahkan ketua_kelas ke enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ketua_kelas';

-- Tambahkan value lain jika belum ada
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'wali_kelas';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'bendahara';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'sekretaris';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';

-- ERROR 2: Fix ID auto-generate
-- Set default value untuk kolom id

ALTER TABLE profiles 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify
SELECT column_name, column_default, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'id';

-- ============================================
-- ALTERNATIF: Jika enum tidak bisa diubah
-- ============================================

-- Jika ALTER TYPE error, drop dan buat ulang enum:

-- 1. Backup data dulu (jika ada)
-- 2. Drop constraint yang pakai enum
-- ALTER TABLE profiles ALTER COLUMN role TYPE TEXT;

-- 3. Drop enum lama
-- DROP TYPE IF EXISTS user_role CASCADE;

-- 4. Buat enum baru
-- CREATE TYPE user_role AS ENUM (
--   'admin',
--   'sekretaris', 
--   'bendahara',
--   'wali_kelas',
--   'ketua_kelas'
-- );

-- 5. Set column kembali ke enum
-- ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::user_role;
