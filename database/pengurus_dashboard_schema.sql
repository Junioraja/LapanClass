-- ============================================
-- DATABASE SCHEMA UNTUK DASHBOARD PENGURUS
-- ============================================

-- 1. Tabel Kelengkapan Kelas (Class Equipment/Inventory)
CREATE TABLE IF NOT EXISTS class_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nama_barang TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 1,
  kondisi TEXT NOT NULL CHECK (kondisi IN ('baik', 'perlu_ganti', 'rusak')),
  keterangan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_class_equipment_class_id ON class_equipment(class_id);
CREATE INDEX IF NOT EXISTS idx_class_equipment_kondisi ON class_equipment(kondisi);

-- 2. Tabel Kas Kelas (Class Finance)
CREATE TABLE IF NOT EXISTS class_finance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  jumlah NUMERIC(15, 2) NOT NULL,
  kategori TEXT NOT NULL, -- iuran, donasi, pembelian, dll
  keterangan TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_class_finance_class_id ON class_finance(class_id);
CREATE INDEX IF NOT EXISTS idx_class_finance_tanggal ON class_finance(tanggal);
CREATE INDEX IF NOT EXISTS idx_class_finance_jenis ON class_finance(jenis);

-- 3. Enable RLS (optional, bisa disable dulu untuk development)
-- ALTER TABLE class_equipment ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE class_finance ENABLE ROW LEVEL SECURITY;

-- Atau disable untuk development:
ALTER TABLE class_equipment DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_finance DISABLE ROW LEVEL SECURITY;

-- ============================================
-- SAMPLE DATA UNTUK TESTING
-- ============================================

-- Insert sample kelengkapan kelas (ganti UUID class_id dengan ID kelas yang ada)
-- Cara cek ID kelas: SELECT id, nama_kelas FROM classes;

-- Contoh insert (sesuaikan class_id dengan kelas yang ada):
INSERT INTO class_equipment (class_id, nama_barang, jumlah, kondisi, keterangan)
VALUES 
  ((SELECT id FROM classes LIMIT 1), 'Papan Tulis', 1, 'baik', 'Kondisi bagus'),
  ((SELECT id FROM classes LIMIT 1), 'Spidol Board Marker', 3, 'perlu_ganti', 'Hampir habis'),
  ((SELECT id FROM classes LIMIT 1), 'Sapu', 2, 'baik', 'Lengkap'),
  ((SELECT id FROM classes LIMIT 1), 'Kemoceng', 1, 'rusak', 'Perlu diganti'),
  ((SELECT id FROM classes LIMIT 1), 'Tempat Sampah', 2, 'baik', 'Bersih'),
  ((SELECT id FROM classes LIMIT 1), 'Penghapus Papan', 1, 'baik', NULL),
  ((SELECT id FROM classes LIMIT 1), 'Penggaris Panjang', 1, 'baik', NULL);

-- Insert sample data kas kelas (untuk grafik dan stats)
-- Data bulan ini
INSERT INTO class_finance (class_id, tanggal, jenis, jumlah, kategori, keterangan)
VALUES
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '25 days', 'masuk', 500000, 'iuran', 'Iuran bulanan Januari'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '20 days', 'masuk', 200000, 'donasi', 'Donasi alumni'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '18 days', 'keluar', 150000, 'pembelian', 'Beli sapu & kemoceng'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '15 days', 'masuk', 100000, 'iuran', 'Iuran tambahan'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '10 days', 'keluar', 300000, 'pembelian', 'Beli printer'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '5 days', 'keluar', 200000, 'acara', 'Ulang tahun kelas'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '2 days', 'masuk', 50000, 'lain', 'Penjualan barang bekas');

-- Data bulan-bulan sebelumnya untuk grafik
INSERT INTO class_finance (class_id, tanggal, jenis, jumlah, kategori, keterangan)
VALUES
  -- Desember
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '35 days', 'masuk', 500000, 'iuran', 'Iuran Desember'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '40 days', 'keluar', 250000, 'acara', 'Natal kelas'),
  -- November
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '65 days', 'masuk', 500000, 'iuran', 'Iuran November'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '70 days', 'keluar', 150000, 'pembelian', 'Alat kebersihan'),
  -- Oktober
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '95 days', 'masuk', 500000, 'iuran', 'Iuran Oktober'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '100 days', 'keluar', 350000, 'acara', 'Study tour'),
  -- September
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '125 days', 'masuk', 600000, 'iuran', 'Iuran September'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '130 days', 'keluar', 200000, 'pembelian', 'Buku perpustakaan'),
  -- Agustus
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '155 days', 'masuk', 500000, 'iuran', 'Iuran Agustus'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '160 days', 'masuk', 300000, 'donasi', 'Donasi 17 Agustus'),
  ((SELECT id FROM classes LIMIT 1), CURRENT_DATE - INTERVAL '165 days', 'keluar', 400000, 'acara', 'Lomba 17an');

-- ============================================
-- HELPER QUERIES (untuk testing)
-- ============================================

-- Lihat kelengkapan kelas
SELECT * FROM class_equipment ORDER BY created_at DESC;

-- Lihat kas kelas
SELECT * FROM class_finance ORDER BY tanggal DESC;

-- Hitung saldo kas per kelas
SELECT 
  class_id,
  SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) as total_masuk,
  SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) as total_keluar,
  SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE -jumlah END) as saldo
FROM class_finance
GROUP BY class_id;

-- Transaksi bulan ini per kelas
SELECT 
  class_id,
  COUNT(*) as total_transaksi,
  SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END) as pemasukan,
  SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END) as pengeluaran
FROM class_finance
WHERE DATE_TRUNC('month', tanggal) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY class_id;

-- Kelengkapan per kondisi
SELECT 
  class_id,
  kondisi,
  COUNT(*) as jumlah
FROM class_equipment
GROUP BY class_id, kondisi;
