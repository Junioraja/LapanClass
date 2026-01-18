-- ============================================
-- INSERT ADMIN USER
-- Sesuai dengan schema tabel profiles yang ada
-- ============================================

-- Schema profiles:
-- id, nis, nama, role, created_at, nomor_absen, class_id, 
-- phone, password, custom_id, is_approved, approved_by, 
-- jabatan, is_block

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
  is_block
)
VALUES (
  gen_random_uuid(),
  NULL,  -- nis untuk admin tidak perlu
  'Super Admin',
  'admin',
  NULL,  -- nomor_absen untuk admin tidak perlu
  NULL,  -- class_id untuk admin tidak perlu
  '08123456789',
  '$2b$10$VeTOEdaWxZUivO/zV.PdT.DswyiGlD.iTxXF/FoLyUKO8s4tGzI.e',  -- Hash dari: dediayambakar
  'ADMINRPL',
  TRUE,
  NULL,
  'Administrator',
  FALSE
)
ON CONFLICT (custom_id) DO NOTHING;

-- ============================================
-- VERIFY
-- ============================================
-- Cek apakah admin user berhasil dibuat:
SELECT id, nama, role, custom_id, is_approved, is_block 
FROM profiles 
WHERE custom_id = 'ADMINRPL';

-- ============================================
-- LOGIN CREDENTIALS
-- ============================================
-- Custom ID: ADMINRPL
-- Password: dediayambakar
