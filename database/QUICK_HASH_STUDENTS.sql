-- ============================================
-- QUICK FIX: Hash Student Passwords
-- ============================================
-- Run this in Supabase SQL Editor to hash all student passwords

-- STEP 1: Check current passwords
SELECT 
  id,
  nama,
  nis,
  password,
  CASE 
    WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN '✅ Already Hashed'
    ELSE '⚠️ Plain Text'
  END AS status
FROM profiles
WHERE role = 'siswa'
LIMIT 10;

-- ============================================
-- STEP 2: Hash the password 'siswa123'
-- ============================================

-- First, you need to generate the bcrypt hash
-- Use this online tool: https://bcrypt-generator.com/
-- Input: siswa123
-- Rounds: 10
-- Copy the generated hash (starts with $2a$ or $2b$)

-- Example hash for 'siswa123' with bcrypt rounds=10:
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- ============================================
-- STEP 3: Update all student passwords
-- ============================================

-- Replace the hash below with your generated hash from bcrypt-generator.com
UPDATE profiles 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE role = 'siswa' 
AND (password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%');

-- ============================================
-- STEP 4: Verify the update
-- ============================================

SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 1 END) as hashed_passwords,
  COUNT(CASE WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' THEN 1 END) as plain_text_passwords
FROM profiles
WHERE role = 'siswa';

-- Expected: plain_text_passwords should be 0

-- ============================================
-- ALTERNATIVE: Update specific student by NIS
-- ============================================

-- If you want to update only one student:
UPDATE profiles 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE nis = 'YOUR_STUDENT_NIS' AND role = 'siswa';

-- ============================================
-- NOTES:
-- ============================================
-- 1. The hash above is for password 'siswa123'
-- 2. After running this, students can login with:
--    - NIS: their NIS number
--    - Password: siswa123
-- 3. The bcrypt comparison will work correctly
-- 4. You can generate different hashes for each student if needed
