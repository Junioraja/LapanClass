-- ============================================
-- FIX SCHEMA PROFILES TABLE
-- ============================================

-- Option 1: Rename kolom 'nama' jadi 'nama_lengkap' (RECOMMENDED)
-- Ini agar match dengan kode yang sudah dibuat
ALTER TABLE profiles RENAME COLUMN nama TO nama_lengkap;

-- Option 2: Atau tambahkan kolom 'nama_lengkap' jika kolom 'nama' masih dipakai
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nama_lengkap TEXT;
-- UPDATE profiles SET nama_lengkap = nama WHERE nama_lengkap IS NULL;

-- Tambahkan kolom yang diperlukan jika belum ada
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nomor_telepon TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- Hapus kolom 'jabatan' jika tidak dipakai (optional)
-- ALTER TABLE profiles DROP COLUMN IF EXISTS jabatan;

-- ============================================
-- CREATE ADMIN USER (dengan password hash)
-- ============================================

-- Catatan: Password 'LapanClass2026' di-hash dengan bcrypt
-- Hash ini: $2b$10$YourHashHere...

-- Gunakan query ini untuk insert admin:
INSERT INTO profiles (
  id, 
  nama_lengkap, 
  nomor_telepon,
  role, 
  custom_id, 
  password, 
  is_approved,
  is_blocked,
  class_id
)
VALUES (
  gen_random_uuid(), 
  'Super Admin',
  '08123456789',
  'admin', 
  'ADMIN-001', 
  '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUvIapDduy', -- Password: LapanClass2026
  TRUE,
  FALSE,
  NULL
)
ON CONFLICT (custom_id) DO NOTHING;

-- ============================================
-- VERIFY SCHEMA
-- ============================================
-- Setelah migrasi, tabel profiles harus punya kolom:
-- - id (UUID)
-- - nama_lengkap (TEXT)
-- - nomor_telepon (TEXT)
-- - role (TEXT)
-- - custom_id (TEXT, UNIQUE)
-- - password (TEXT)
-- - is_approved (BOOLEAN)
-- - is_blocked (BOOLEAN)
-- - class_id (UUID, nullable untuk admin)
-- - created_at (TIMESTAMP)
