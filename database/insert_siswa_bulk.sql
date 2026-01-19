-- ========================================
-- BULK INSERT SISWA
-- Updated berdasarkan struktur tabel yang benar
-- ========================================

-- ========================================
-- TABEL students_master
-- ========================================
-- Kolom: id, class_id, nomor_absen, nis, nama, password, is_password_changed, is_blocked

-- Contoh 1: Insert 1 siswa ke students_master
INSERT INTO students_master (class_id, nomor_absen, nis, nama, password, is_password_changed, is_blocked)
VALUES (
    'your-class-id-here',      -- class_id (UUID dari tabel classes)
    1,                         -- nomor_absen (unique per class)
    '12345',                   -- nis (nomor induk siswa)
    'Budi Santoso',            -- nama siswa
    'siswa123',                -- password plaintext (atau gunakan hash)
    false,                     -- is_password_changed
    false                      -- is_blocked (false = aktif)
);

-- ========================================
-- Contoh 2: Insert BANYAK siswa sekaligus
-- Password semua siswa = 'siswa123'
-- ========================================
INSERT INTO students_master (class_id, nomor_absen, nis, nama, password, is_password_changed, is_blocked)
VALUES 
    ('your-class-id-here', 1, '20001', 'Andi Pratama', 'siswa123', false, false),
    ('your-class-id-here', 2, '20002', 'Dewi Lestari', 'siswa123', false, false),
    ('your-class-id-here', 3, '20003', 'Eko Saputra', 'siswa123', false, false),
    ('your-class-id-here', 4, '20004', 'Fitri Handayani', 'siswa123', false, false),
    ('your-class-id-here', 5, '20005', 'Galih Permana', 'siswa123', false, false),
    ('your-class-id-here', 6, '20006', 'Hendra Wijaya', 'siswa123', false, false),
    ('your-class-id-here', 7, '20007', 'Indah Sari', 'siswa123', false, false),
    ('your-class-id-here', 8, '20008', 'Joko Widodo', 'siswa123', false, false),
    ('your-class-id-here', 9, '20009', 'Kartika Putri', 'siswa123', false, false),
    ('your-class-id-here', 10, '20010', 'Lukman Hakim', 'siswa123', false, false);

-- ========================================
-- TABEL profiles
-- ========================================
-- Kolom: id, nis, nama, role, created_at, nomor_absen, class_id, phone, 
--        password, custom_id, is_approved, approved_by, jabatan, is_blocked

-- Contoh 3: Insert 1 siswa ke profiles
INSERT INTO profiles (nis, nama, role, nomor_absen, class_id, phone, password, custom_id, is_approved, jabatan, is_blocked)
VALUES (
    '12345',                   -- nis
    'Budi Santoso',            -- nama
    'siswa',                   -- role
    1,                         -- nomor_absen
    'your-class-id-here',      -- class_id
    '081234567890',            -- phone (opsional, bisa NULL)
    'siswa123',                -- password
    '12345',                   -- custom_id (biasanya sama dengan NIS)
    true,                      -- is_approved
    NULL,                      -- jabatan (NULL untuk siswa biasa)
    false                      -- is_blocked
);

-- ========================================
-- Contoh 4: Insert BANYAK siswa ke profiles
-- ========================================
INSERT INTO profiles (nis, nama, role, nomor_absen, class_id, phone, password, custom_id, is_approved, jabatan, is_blocked)
VALUES 
    ('20001', 'Andi Pratama', 'siswa', 1, 'your-class-id-here', NULL, 'siswa123', '20001', true, NULL, false),
    ('20002', 'Dewi Lestari', 'siswa', 2, 'your-class-id-here', NULL, 'siswa123', '20002', true, NULL, false),
    ('20003', 'Eko Saputra', 'siswa', 3, 'your-class-id-here', NULL, 'siswa123', '20003', true, NULL, false),
    ('20004', 'Fitri Handayani', 'siswa', 4, 'your-class-id-here', NULL, 'siswa123', '20004', true, NULL, false),
    ('20005', 'Galih Permana', 'siswa', 5, 'your-class-id-here', NULL, 'siswa123', '20005', true, NULL, false),
    ('20006', 'Hendra Wijaya', 'siswa', 6, 'your-class-id-here', NULL, 'siswa123', '20006', true, NULL, false),
    ('20007', 'Indah Sari', 'siswa', 7, 'your-class-id-here', NULL, 'siswa123', '20007', true, NULL, false),
    ('20008', 'Joko Widodo', 'siswa', 8, 'your-class-id-here', NULL, 'siswa123', '20008', true, NULL, false),
    ('20009', 'Kartika Putri', 'siswa', 9, 'your-class-id-here', NULL, 'siswa123', '20009', true, NULL, false),
    ('20010', 'Lukman Hakim', 'siswa', 10, 'your-class-id-here', NULL, 'siswa123', '20010', true, NULL, false);

-- ========================================
-- CONTOH LENGKAP: Insert ke KEDUA tabel sekaligus
-- ========================================
-- Class ID example: 'e0698393-2941-42e4-9c87-4c80136d9dfa'

-- Step 1: Insert ke students_master
INSERT INTO students_master (class_id, nomor_absen, nis, nama, password, is_password_changed, is_blocked)
VALUES 
    ('e0698393-2941-42e4-9c87-4c80136d9dfa', 1, '30001', 'Ahmad Abdullah', 'siswa123', false, false),
    ('e0698393-2941-42e4-9c87-4c80136d9dfa', 2, '30002', 'Siti Aminah', 'siswa123', false, false),
    ('e0698393-2941-42e4-9c87-4c80136d9dfa', 3, '30003', 'Muhammad Ali', 'siswa123', false, false),
    ('e0698393-2941-42e4-9c87-4c80136d9dfa', 4, '30004', 'Fatimah Zahra', 'siswa123', false, false),
    ('e0698393-2941-42e4-9c87-4c80136d9dfa', 5, '30005', 'Umar Faruq', 'siswa123', false, false);

-- Step 2: Insert ke profiles
INSERT INTO profiles (nis, nama, role, nomor_absen, class_id, password, custom_id, is_approved, is_blocked)
VALUES 
    ('30001', 'Ahmad Abdullah', 'siswa', 1, 'e0698393-2941-42e4-9c87-4c80136d9dfa', 'siswa123', '30001', true, false),
    ('30002', 'Siti Aminah', 'siswa', 2, 'e0698393-2941-42e4-9c87-4c80136d9dfa', 'siswa123', '30002', true, false),
    ('30003', 'Muhammad Ali', 'siswa', 3, 'e0698393-2941-42e4-9c87-4c80136d9dfa', 'siswa123', '30003', true, false),
    ('30004', 'Fatimah Zahra', 'siswa', 4, 'e0698393-2941-42e4-9c87-4c80136d9dfa', 'siswa123', '30004', true, false),
    ('30005', 'Umar Faruq', 'siswa', 5, 'e0698393-2941-42e4-9c87-4c80136d9dfa', 'siswa123', '30005', true, false);

-- ========================================
-- TEMPLATE: 30 SISWA SATU KELAS
-- ========================================
-- Ganti 'YOUR_CLASS_ID' dengan class_id yang sebenarnya
-- Ganti nama-nama siswa sesuai kebutuhan

-- Insert ke students_master (30 siswa)
INSERT INTO students_master (class_id, nomor_absen, nis, nama, password, is_password_changed, is_blocked)
VALUES 
    ('YOUR_CLASS_ID', 1, '2024001', 'Siswa 01', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 2, '2024002', 'Siswa 02', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 3, '2024003', 'Siswa 03', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 4, '2024004', 'Siswa 04', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 5, '2024005', 'Siswa 05', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 6, '2024006', 'Siswa 06', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 7, '2024007', 'Siswa 07', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 8, '2024008', 'Siswa 08', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 9, '2024009', 'Siswa 09', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 10, '2024010', 'Siswa 10', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 11, '2024011', 'Siswa 11', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 12, '2024012', 'Siswa 12', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 13, '2024013', 'Siswa 13', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 14, '2024014', 'Siswa 14', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 15, '2024015', 'Siswa 15', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 16, '2024016', 'Siswa 16', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 17, '2024017', 'Siswa 17', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 18, '2024018', 'Siswa 18', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 19, '2024019', 'Siswa 19', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 20, '2024020', 'Siswa 20', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 21, '2024021', 'Siswa 21', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 22, '2024022', 'Siswa 22', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 23, '2024023', 'Siswa 23', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 24, '2024024', 'Siswa 24', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 25, '2024025', 'Siswa 25', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 26, '2024026', 'Siswa 26', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 27, '2024027', 'Siswa 27', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 28, '2024028', 'Siswa 28', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 29, '2024029', 'Siswa 29', 'siswa123', false, false),
    ('YOUR_CLASS_ID', 30, '2024030', 'Siswa 30', 'siswa123', false, false);

-- Insert ke profiles (30 siswa)
INSERT INTO profiles (nis, nama, role, nomor_absen, class_id, password, custom_id, is_approved, is_blocked)
VALUES 
    ('2024001', 'Siswa 01', 'siswa', 1, 'YOUR_CLASS_ID', 'siswa123', '2024001', true, false),
    ('2024002', 'Siswa 02', 'siswa', 2, 'YOUR_CLASS_ID', 'siswa123', '2024002', true, false),
    ('2024003', 'Siswa 03', 'siswa', 3, 'YOUR_CLASS_ID', 'siswa123', '2024003', true, false),
    ('2024004', 'Siswa 04', 'siswa', 4, 'YOUR_CLASS_ID', 'siswa123', '2024004', true, false),
    ('2024005', 'Siswa 05', 'siswa', 5, 'YOUR_CLASS_ID', 'siswa123', '2024005', true, false),
    ('2024006', 'Siswa 06', 'siswa', 6, 'YOUR_CLASS_ID', 'siswa123', '2024006', true, false),
    ('2024007', 'Siswa 07', 'siswa', 7, 'YOUR_CLASS_ID', 'siswa123', '2024007', true, false),
    ('2024008', 'Siswa 08', 'siswa', 8, 'YOUR_CLASS_ID', 'siswa123', '2024008', true, false),
    ('2024009', 'Siswa 09', 'siswa', 9, 'YOUR_CLASS_ID', 'siswa123', '2024009', true, false),
    ('2024010', 'Siswa 10', 'siswa', 10, 'YOUR_CLASS_ID', 'siswa123', '2024010', true, false),
    ('2024011', 'Siswa 11', 'siswa', 11, 'YOUR_CLASS_ID', 'siswa123', '2024011', true, false),
    ('2024012', 'Siswa 12', 'siswa', 12, 'YOUR_CLASS_ID', 'siswa123', '2024012', true, false),
    ('2024013', 'Siswa 13', 'siswa', 13, 'YOUR_CLASS_ID', 'siswa123', '2024013', true, false),
    ('2024014', 'Siswa 14', 'siswa', 14, 'YOUR_CLASS_ID', 'siswa123', '2024014', true, false),
    ('2024015', 'Siswa 15', 'siswa', 15, 'YOUR_CLASS_ID', 'siswa123', '2024015', true, false),
    ('2024016', 'Siswa 16', 'siswa', 16, 'YOUR_CLASS_ID', 'siswa123', '2024016', true, false),
    ('2024017', 'Siswa 17', 'siswa', 17, 'YOUR_CLASS_ID', 'siswa123', '2024017', true, false),
    ('2024018', 'Siswa 18', 'siswa', 18, 'YOUR_CLASS_ID', 'siswa123', '2024018', true, false),
    ('2024019', 'Siswa 19', 'siswa', 19, 'YOUR_CLASS_ID', 'siswa123', '2024019', true, false),
    ('2024020', 'Siswa 20', 'siswa', 20, 'YOUR_CLASS_ID', 'siswa123', '2024020', true, false),
    ('2024021', 'Siswa 21', 'siswa', 21, 'YOUR_CLASS_ID', 'siswa123', '2024021', true, false),
    ('2024022', 'Siswa 22', 'siswa', 22, 'YOUR_CLASS_ID', 'siswa123', '2024022', true, false),
    ('2024023', 'Siswa 23', 'siswa', 23, 'YOUR_CLASS_ID', 'siswa123', '2024023', true, false),
    ('2024024', 'Siswa 24', 'siswa', 24, 'YOUR_CLASS_ID', 'siswa123', '2024024', true, false),
    ('2024025', 'Siswa 25', 'siswa', 25, 'YOUR_CLASS_ID', 'siswa123', '2024025', true, false),
    ('2024026', 'Siswa 26', 'siswa', 26, 'YOUR_CLASS_ID', 'siswa123', '2024026', true, false),
    ('2024027', 'Siswa 27', 'siswa', 27, 'YOUR_CLASS_ID', 'siswa123', '2024027', true, false),
    ('2024028', 'Siswa 28', 'siswa', 28, 'YOUR_CLASS_ID', 'siswa123', '2024028', true, false),
    ('2024029', 'Siswa 29', 'siswa', 29, 'YOUR_CLASS_ID', 'siswa123', '2024029', true, false),
    ('2024030', 'Siswa 30', 'siswa', 30, 'YOUR_CLASS_ID', 'siswa123', '2024030', true, false);

-- ========================================
-- CARA MENDAPATKAN class_id
-- ========================================
SELECT id, nama_kelas, tingkat FROM classes ORDER BY nama_kelas;

-- ========================================
-- VERIFIKASI DATA BERHASIL DIINSERT
-- ========================================
-- Check students_master:
SELECT nis, nama, nomor_absen, is_blocked 
FROM students_master 
WHERE class_id = 'YOUR_CLASS_ID'
ORDER BY nomor_absen;

-- Check profiles:
SELECT nis, nama, role, nomor_absen, is_approved, is_blocked 
FROM profiles 
WHERE role = 'siswa' AND class_id = 'YOUR_CLASS_ID'
ORDER BY nomor_absen;

-- Hitung total siswa per class:
SELECT class_id, COUNT(*) as total_siswa 
FROM students_master 
GROUP BY class_id;

-- ========================================
-- UPDATE DATA (jika perlu)
-- ========================================
-- Update password semua siswa di class tertentu:
UPDATE students_master 
SET password = 'newpassword123' 
WHERE class_id = 'YOUR_CLASS_ID';

UPDATE profiles 
SET password = 'newpassword123' 
WHERE role = 'siswa' AND class_id = 'YOUR_CLASS_ID';

-- Block/Unblock siswa tertentu:
UPDATE students_master 
SET is_blocked = true 
WHERE nis = '2024001';

UPDATE profiles 
SET is_blocked = true 
WHERE nis = '2024001';

-- ========================================
-- DELETE DATA (HATI-HATI!)
-- ========================================
-- Hapus semua siswa di class tertentu:
-- DELETE FROM students_master WHERE class_id = 'YOUR_CLASS_ID';
-- DELETE FROM profiles WHERE role = 'siswa' AND class_id = 'YOUR_CLASS_ID';

-- Hapus 1 siswa berdasarkan NIS:
-- DELETE FROM students_master WHERE nis = '2024001';
-- DELETE FROM profiles WHERE nis = '2024001';

-- ========================================
-- CATATAN PENTING
-- ========================================
-- 1. NIS harus UNIK di seluruh sistem
-- 2. nomor_absen harus UNIK per class_id
-- 3. Password disimpan dalam plaintext (untuk kemudahan)
-- 4. is_approved = true agar siswa bisa langsung login
-- 5. jabatan = NULL untuk siswa biasa (kolom opsional)
-- 6. phone = NULL jika tidak ada nomor telepon
-- 7. Pastikan insert ke KEDUA tabel (students_master + profiles)
