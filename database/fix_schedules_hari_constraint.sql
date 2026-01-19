-- ========================================
-- FIX: schedules_hari_check constraint
-- ========================================

-- Step 1: Check current constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
AND conname LIKE '%hari%';

-- Step 2: Drop existing constraint (if wrong)
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_hari_check;

-- Step 3: Add correct constraint (lowercase days)
ALTER TABLE schedules
ADD CONSTRAINT schedules_hari_check
CHECK (hari IN ('senin', 'selasa', 'rabu', 'kamis', 'jumat'));

-- ========================================
-- Alternative: If you want capitalized
-- ========================================
-- ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_hari_check;
-- ALTER TABLE schedules
-- ADD CONSTRAINT schedules_hari_check
-- CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'));

-- ========================================
-- Verify constraint
-- ========================================
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'schedules'::regclass
AND conname = 'schedules_hari_check';

-- ========================================
-- Test insert (should work after fix)
-- ========================================
-- INSERT INTO schedules (class_id, hari, subject_id, jam_mulai, jam_selesai)
-- VALUES ('your-class-id', 'senin', 'your-subject-id', 1, 2);
