-- ============================================
-- DATABASE SCHEMA: SISTEM BENDAHARA KELAS
-- ============================================

-- 1. Tabel Pengaturan Kas Kelas
CREATE TABLE IF NOT EXISTS kas_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  periode_type TEXT NOT NULL CHECK (periode_type IN ('harian', 'mingguan', 'bulanan')),
  periode_value INTEGER, -- Untuk harian: setiap X hari (NULL jika setiap hari)
  periode_day TEXT[], -- Array hari: ['senin','rabu'] atau tanggal: ['1','15','30']
  nominal_per_periode NUMERIC(15,2) NOT NULL,
  metode_default TEXT DEFAULT 'cash' CHECK (metode_default IN ('cash', 'qris')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Pembayaran Kas Per Siswa
CREATE TABLE IF NOT EXISTS kas_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students_master(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  periode_bulan TEXT NOT NULL, -- 'Januari 2026', 'Februari 2026', 'Minggu 1 Jan', dll
  jumlah_periode INTEGER NOT NULL DEFAULT 1, -- Bayar berapa bulan/minggu sekaligus
  nominal NUMERIC(15,2) NOT NULL,
  metode TEXT DEFAULT 'cash' CHECK (metode IN ('cash', 'qris')),
  is_auto BOOLEAN DEFAULT TRUE, -- TRUE = otomatis, FALSE = custom
  keterangan TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Pengeluaran Kas Kelas
CREATE TABLE IF NOT EXISTS kas_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nominal NUMERIC(15,2) NOT NULL,
  kategori TEXT NOT NULL, -- 'alat_tulis', 'acara', 'perawatan', 'konsumsi', dll
  keterangan TEXT NOT NULL,
  bukti_url TEXT, -- Optional: link foto bukti
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Tabungan & Iuran Kelas
CREATE TABLE IF NOT EXISTS class_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nama TEXT NOT NULL, -- 'Tabungan Study Tour', 'Iuran Jumat Amal'
  jenis TEXT NOT NULL CHECK (jenis IN ('tabungan', 'iuran')),
  target_amount NUMERIC(15,2), -- NULL untuk iuran (tidak ada target)
  target_date DATE, -- NULL untuk iuran
  periode_type TEXT NOT NULL CHECK (periode_type IN ('harian', 'mingguan', 'bulanan')),
  periode_value INTEGER,
  periode_day TEXT[],
  nominal_per_periode NUMERIC(15,2) NOT NULL,
  metode_default TEXT DEFAULT 'cash' CHECK (metode_default IN ('cash', 'qris')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel Pembayaran Tabungan/Iuran Per Siswa
CREATE TABLE IF NOT EXISTS savings_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  savings_id UUID NOT NULL REFERENCES class_savings(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students_master(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  nominal NUMERIC(15,2) NOT NULL,
  metode TEXT DEFAULT 'cash' CHECK (metode IN ('cash', 'qris')),
  keterangan TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES untuk performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_kas_settings_class ON kas_settings(class_id);
CREATE INDEX IF NOT EXISTS idx_kas_payments_class ON kas_payments(class_id);
CREATE INDEX IF NOT EXISTS idx_kas_payments_student ON kas_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_kas_payments_tanggal ON kas_payments(tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_expenses_class ON kas_expenses(class_id);
CREATE INDEX IF NOT EXISTS idx_kas_expenses_tanggal ON kas_expenses(tanggal);
CREATE INDEX IF NOT EXISTS idx_class_savings_class ON class_savings(class_id);
CREATE INDEX IF NOT EXISTS idx_savings_payments_savings ON savings_payments(savings_id);
CREATE INDEX IF NOT EXISTS idx_savings_payments_student ON savings_payments(student_id);

-- ============================================
-- RLS (Row Level Security) - Disable untuk development
-- ============================================

ALTER TABLE kas_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE kas_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE kas_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_savings DISABLE ROW LEVEL SECURITY;
ALTER TABLE savings_payments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- SAMPLE DATA untuk Testing
-- ============================================

-- Insert sample kas settings
INSERT INTO kas_settings (class_id, periode_type, periode_day, nominal_per_periode, metode_default)
VALUES 
  ((SELECT id FROM classes LIMIT 1), 'mingguan', ARRAY['senin'], 5000, 'cash');

-- Insert sample kas payments
INSERT INTO kas_payments (class_id, student_id, tanggal, periode_bulan, jumlah_periode, nominal, metode, is_auto)
SELECT 
  (SELECT id FROM classes LIMIT 1),
  s.id,
  CURRENT_DATE,
  'Januari 2026',
  1,
  5000,
  'cash',
  TRUE
FROM students_master s
WHERE s.class_id = (SELECT id FROM classes LIMIT 1)
LIMIT 5; -- Sample 5 siswa bayar

-- Insert sample expenses
INSERT INTO kas_expenses (class_id, tanggal, nominal, kategori, keterangan)
VALUES
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '5 days', 50000, 'alat_tulis', 'Beli spidol dan kertas'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '10 days', 150000, 'perawatan', 'Service kipas angin'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '15 days', 200000, 'acara', 'Ulang tahun kelas');

-- Insert sample tabungan
INSERT INTO class_savings (class_id, nama, jenis, target_amount, target_date, periode_type, nominal_per_periode, metode_default)
VALUES
  ((SELECT id FROM classes LIMIT 1), 'Tabungan Study Tour', 'tabungan', 5000000, CURRENT_DATE + INTERVAL '6 months', 'bulanan', 50000, 'cash'),
  ((SELECT id FROM classes LIMIT 1), 'Iuran Jumat Amal', 'iuran', NULL, NULL, 'mingguan', 2000, 'cash');

-- Insert sample savings payments
INSERT INTO savings_payments (savings_id, student_id, tanggal, nominal, metode)
SELECT 
  (SELECT id FROM class_savings WHERE jenis = 'tabungan' LIMIT 1),
  s.id,
  CURRENT_DATE,
  50000,
  'cash'
FROM students_master s
WHERE s.class_id = (SELECT id FROM classes LIMIT 1)
LIMIT 3; -- Sample 3 siswa bayar tabungan

-- ============================================
-- HELPER QUERIES untuk Development
-- ============================================

-- Lihat settings kas
SELECT * FROM kas_settings;

-- Lihat pembayaran kas
SELECT kp.*, s.nama AS nama_siswa, s.nis
FROM kas_payments kp
JOIN students_master s ON kp.student_id = s.id
ORDER BY kp.tanggal DESC;

-- Hitung saldo kas per kelas
SELECT 
  class_id,
  (
    SELECT COALESCE(SUM(nominal), 0) 
    FROM kas_payments 
    WHERE class_id = kp.class_id
  ) - (
    SELECT COALESCE(SUM(nominal), 0)
    FROM kas_expenses
    WHERE class_id = kp.class_id
  ) AS saldo_kas
FROM kas_payments kp
GROUP BY class_id;

-- Siswa belum bayar kas bulan ini
SELECT s.nama, s.nis
FROM students_master s
WHERE s.class_id = (SELECT id FROM classes LIMIT 1)
AND s.id NOT IN (
  SELECT student_id 
  FROM kas_payments 
  WHERE class_id = s.class_id
  AND DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
);

-- Progress tabungan
SELECT 
  cs.nama,
  cs.target_amount,
  COALESCE(SUM(sp.nominal), 0) AS terkumpul,
  cs.target_amount - COALESCE(SUM(sp.nominal), 0) AS sisa,
  ROUND((COALESCE(SUM(sp.nominal), 0) / NULLIF(cs.target_amount, 0) * 100), 2) AS progress_persen
FROM class_savings cs
LEFT JOIN savings_payments sp ON cs.id = sp.savings_id
WHERE cs.jenis = 'tabungan'
GROUP BY cs.id, cs.nama, cs.target_amount;

-- ============================================
-- VIEWS untuk kemudahan query
-- ============================================

-- View: Ringkasan kas per kelas
CREATE OR REPLACE VIEW view_kas_summary AS
SELECT 
  c.id AS class_id,
  c.nama_kelas,
  COALESCE(SUM(kp.nominal), 0) AS total_pemasukan,
  COALESCE((SELECT SUM(nominal) FROM kas_expenses ke WHERE ke.class_id = c.id), 0) AS total_pengeluaran,
  COALESCE(SUM(kp.nominal), 0) - COALESCE((SELECT SUM(nominal) FROM kas_expenses ke WHERE ke.class_id = c.id), 0) AS saldo_akhir
FROM classes c
LEFT JOIN kas_payments kp ON c.id = kp.class_id
GROUP BY c.id, c.nama_kelas;

-- View: Siswa yang belum bayar kas bulan ini
CREATE OR REPLACE VIEW view_siswa_belum_bayar AS
SELECT 
  s.id,
  s.nama,
  s.nis,
  s.class_id,
  c.nama_kelas,
  (
    SELECT COUNT(DISTINCT DATE_TRUNC('month', tanggal))
    FROM kas_payments kp2
    WHERE kp2.student_id = s.id
    AND kp2.tanggal >= DATE_TRUNC('year', CURRENT_DATE)
  ) AS bulan_terbayar_tahun_ini
FROM students_master s
JOIN classes c ON s.class_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM kas_payments kp
  WHERE kp.student_id = s.id
  AND DATE_TRUNC('month', kp.tanggal) = DATE_TRUNC('month', CURRENT_DATE)
);
