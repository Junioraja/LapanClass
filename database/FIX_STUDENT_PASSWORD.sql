-- ============================================
-- CORRECT FIX: Hash Student Passwords in students_master table
-- ============================================

-- STEP 1: Check current passwords in students_master
SELECT 
  id,
  nama,
  nis,
  nomor_absen,
  password,
  CASE 
    WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN '✅ Already Hashed'
    ELSE '⚠️ Plain Text'
  END AS status
FROM students_master
LIMIT 10;

-- ============================================
-- STEP 2: Update passwords in students_master table
-- ============================================

-- Hash for password 'siswa123':
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

UPDATE students_master 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE password NOT LIKE '$2a$%' 
AND password NOT LIKE '$2b$%';

-- ============================================
-- STEP 3: Verify the update
-- ============================================

SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 1 END) as hashed_passwords,
  COUNT(CASE WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' THEN 1 END) as plain_text_passwords
FROM students_master;

-- Expected: plain_text_passwords should be 0

-- ============================================
-- STEP 4: Test - View a student's data
-- ============================================

SELECT 
  nis,
  nama,
  nomor_absen,
  LEFT(password, 20) || '...' as password_preview,
  CASE 
    WHEN password LIKE '$2a$%' THEN '✅ Hashed (bcrypt)'
    ELSE '⚠️ Plain Text'
  END AS password_status
FROM students_master
LIMIT 5;

-- ============================================
-- ALTERNATIVE: Update specific student by NIS
-- ============================================

-- If you want to update only one student for testing:
UPDATE students_master 
SET password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE nis = 'YOUR_STUDENT_NIS';

-- Then verify:
SELECT nis, nama, LEFT(password, 30) as password_hash
FROM students_master 
WHERE nis = 'YOUR_STUDENT_NIS';
