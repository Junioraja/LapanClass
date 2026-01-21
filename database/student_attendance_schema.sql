-- ============================================
-- DATABASE SCHEMA UPDATE: STUDENT ATTENDANCE SYSTEM
-- ============================================

-- 1. Add foto_bukti column to attendance table
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS foto_bukti TEXT;

COMMENT ON COLUMN attendance.foto_bukti IS 'URL to photo proof stored in Supabase storage bucket: bukti-surat-izin';

-- 2. Create izin_telat table for late permissions
CREATE TABLE IF NOT EXISTS izin_telat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students_master(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jam_datang TIME NOT NULL,
  foto_bukti TEXT NOT NULL,
  keterangan TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_izin_telat_student ON izin_telat(student_id);
CREATE INDEX IF NOT EXISTS idx_izin_telat_class ON izin_telat(class_id);
CREATE INDEX IF NOT EXISTS idx_izin_telat_tanggal ON izin_telat(tanggal);
CREATE INDEX IF NOT EXISTS idx_attendance_foto ON attendance(foto_bukti) WHERE foto_bukti IS NOT NULL;

-- 4. Disable RLS for development
ALTER TABLE izin_telat DISABLE ROW LEVEL SECURITY;

-- ============================================
-- SUPABASE STORAGE SETUP INSTRUCTIONS
-- ============================================

-- Run these commands in Supabase Dashboard > Storage:

-- 1. Create bucket 'bukti-surat-izin' (if not exists)
-- 2. Set bucket to PUBLIC or configure RLS:

-- Example RLS policy for authenticated users to upload:
-- CREATE POLICY "Allow authenticated users to upload"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'bukti-surat-izin');

-- Example RLS policy for public read:
-- CREATE POLICY "Public read access"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'bukti-surat-izin');

-- ============================================
-- HELPER QUERIES
-- ============================================

-- View student's attendance with photos
SELECT 
  a.tanggal,
  a.status,
  a.keterangan,
  a.foto_bukti,
  sm.nama,
  sm.nis
FROM attendance a
JOIN students_master sm ON a.student_id = sm.id
WHERE a.foto_bukti IS NOT NULL
ORDER BY a.tanggal DESC;

-- View all late permissions
SELECT 
  it.*,
  sm.nama,
  sm.nis,
  sm.nomor_absen
FROM izin_telat it
JOIN students_master sm ON it.student_id = sm.id
ORDER BY it.tanggal DESC, it.jam_datang DESC;

-- Get student attendance history with photos and late permissions
SELECT 
  'attendance' AS type,
  a.tanggal,
  a.status,
  a.keterangan,
  a.foto_bukti,
  NULL AS jam_datang,
  a.is_approved,
  a.created_at
FROM attendance a
WHERE a.student_id = 'YOUR_STUDENT_ID'

UNION ALL

SELECT 
  'izin_telat' AS type,
  it.tanggal,
  'Terlambat' AS status,
  it.keterangan,
  it.foto_bukti,
  it.jam_datang,
  it.is_approved,
  it.created_at
FROM izin_telat it
WHERE it.student_id = 'YOUR_STUDENT_ID'

ORDER BY tanggal DESC, created_at DESC;
