-- ======================================
-- DIAGNOSIS: pj_siswa_id column type issue
-- ======================================
-- Error message shows:
-- "invalid input syntax for type integer: '83f3dc26-a9cf-4529-ad45-3cea8b9b7570'"
-- 
-- This means pj_siswa_id is INTEGER but code is sending UUID

-- Check current column types
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'schedules'
ORDER BY ordinal_position;

-- ======================================
-- OPTION 1: Change column to UUID
-- ======================================
-- If pj_siswa_id should reference students_master.id (recommended)

ALTER TABLE schedules 
ALTER COLUMN pj_siswa_id TYPE uuid 
USING pj_siswa_id::text::uuid;

-- Add foreign key constraint
ALTER TABLE schedules
ADD CONSTRAINT fk_schedules_pj_siswa
FOREIGN KEY (pj_siswa_id) 
REFERENCES students_master(id)
ON DELETE SET NULL;

-- ======================================
-- OPTION 2: Keep as INTEGER
-- ======================================
-- If pj_siswa_id should store nomor_absen instead

-- In this case, the TypeScript code needs to be modified to:
-- 1. Get nomor_absen from selected student
-- 2. Store nomor_absen instead of student.id

-- No SQL changes needed, only code changes

-- ======================================
-- RECOMMENDATION
-- ======================================
-- Use OPTION 1 (change to UUID) because:
-- 1. More robust - references actual student ID
-- 2. Handles student renumbering (nomor_absen changes)
-- 3. Consistent with other FK relationships
-- 4. Can use JOIN to get student data directly

-- Run this to implement OPTION 1:
ALTER TABLE schedules ALTER COLUMN pj_siswa_id TYPE uuid USING NULL::uuid;
ALTER TABLE schedules ADD CONSTRAINT fk_schedules_pj_siswa FOREIGN KEY (pj_siswa_id) REFERENCES students_master(id) ON DELETE SET NULL;
