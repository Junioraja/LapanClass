-- Database Schema untuk Admin Dashboard Features

-- 1. Tambahkan kolom is_blocked ke profiles dan students_master
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

ALTER TABLE students_master 
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;

-- 2. Buat tabel app_settings untuk feature toggle
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default settings
INSERT INTO app_settings (setting_key, setting_value, description)
VALUES
  ('absensi_enabled', TRUE, 'Aktifkan atau nonaktifkan modul absensi'),
  ('jurnal_enabled', TRUE, 'Aktifkan atau nonaktifkan modul jurnal pembelajaran'),
  ('kas_enabled', TRUE, 'Aktifkan atau nonaktifkan modul kas kelas'),
  ('bendahara_menu_enabled', FALSE, 'Tampilkan atau sembunyikan menu bendahara'),
  ('wali_kelas_menu_enabled', FALSE, 'Tampilkan atau sembunyikan menu wali kelas'),
  ('siswa_dashboard_enabled', FALSE, 'Aktifkan atau nonaktifkan dashboard siswa')
ON CONFLICT (setting_key) DO NOTHING;

-- 4. Enable RLS untuk app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 5. Policy untuk app_settings (hanya admin yang bisa edit, semua bisa lihat)
CREATE POLICY "Enable read app_settings" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Enable update app_settings for admin" ON app_settings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable insert app_settings for admin" ON app_settings FOR INSERT WITH CHECK (true);

-- Note: Untuk production, sebaiknya policy dibuat lebih strict dengan check role admin
