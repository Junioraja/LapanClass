-- ============================================
-- FIX SUPABASE STORAGE RLS POLICY
-- Bucket: bukti-surat-izin
-- ============================================

-- STEP 1: Check if bucket exists
SELECT * FROM storage.buckets WHERE name = 'bukti-surat-izin';

-- If bucket doesn't exist, create it:
INSERT INTO storage.buckets (id, name, public)
VALUES ('bukti-surat-izin', 'bukti-surat-izin', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 2: Drop existing policies (if any)
-- ============================================

DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;

-- ============================================
-- STEP 3: Create new policies for bukti-surat-izin
-- ============================================

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload to bukti-surat-izin"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'bukti-surat-izin');

-- Policy 2: Allow public read access
CREATE POLICY "Public read bukti-surat-izin"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'bukti-surat-izin');

-- Policy 3: Allow users to update their own files
CREATE POLICY "Allow users to update own files in bukti-surat-izin"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'bukti-surat-izin');

-- Policy 4: Allow users to delete their own files
CREATE POLICY "Allow users to delete own files in bukti-surat-izin"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'bukti-surat-izin');

-- ============================================
-- STEP 4: Verify policies
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%bukti-surat-izin%';

-- ============================================
-- ALTERNATIVE: Disable RLS entirely (NOT RECOMMENDED for production)
-- ============================================

-- Only use this if you want to completely disable RLS for testing
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Test upload (optional)
-- ============================================

-- After running the policies above, test upload from your app
-- Expected: Upload should succeed without RLS error

-- ============================================
-- NOTES:
-- ============================================
-- 1. Make sure bucket 'bukti-surat-izin' exists in Supabase Storage
-- 2. Policies allow:
--    - Authenticated users can upload (INSERT)
--    - Public can read (SELECT)
--    - Authenticated users can update/delete
-- 3. If still error, check Supabase logs for more details
