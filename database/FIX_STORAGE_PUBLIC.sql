-- ============================================
-- FINAL FIX: Make bukti-surat-izin bucket PUBLIC
-- ============================================

-- SOLUTION 1: Make bucket public and remove all RLS policies
-- This is the easiest solution for your use case

-- Step 1: Update bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'bukti-surat-izin';

-- Step 2: Drop ALL existing policies for this bucket
DROP POLICY IF EXISTS "Allow authenticated upload to bukti-surat-izin" ON storage.objects;
DROP POLICY IF EXISTS "Public read bukti-surat-izin" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own files in bukti-surat-izin" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own files in bukti-surat-izin" ON storage.objects;

-- Step 3: Create simple public policies
CREATE POLICY "Public Access All bukti-surat-izin"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'bukti-surat-izin')
WITH CHECK (bucket_id = 'bukti-surat-izin');

-- ============================================
-- VERIFY
-- ============================================

-- Check bucket is public
SELECT name, public FROM storage.buckets WHERE name = 'bukti-surat-izin';
-- Expected: public = true

-- Check policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%bukti-surat-izin%';
-- Expected: One policy for ALL operations to public

-- ============================================
-- ALTERNATIVE: Completely disable RLS (if above doesn't work)
-- ============================================

-- WARNING: This disables RLS for ALL storage objects, not just bukti-surat-izin
-- Only use if the above solution doesn't work

-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTES:
-- ============================================
-- 1. Bucket is now PUBLIC - anyone can upload/read/delete
-- 2. This is OK for development/school project
-- 3. For production, you'd want proper authentication
-- 4. Files are organized by student_id folder for easy management
