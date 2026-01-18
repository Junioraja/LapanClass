# Fix Schema & Create Admin User

## 🚨 Masalah yang Terjadi

### Error 1: Column 'nama_lengkap' not found
Kode menggunakan `nama_lengkap`, tapi database Anda punya kolom `nama`

### Error 2: Password tidak di-hash
Password harus di-hash dengan bcrypt, tidak bisa plain text

---

## ✅ Solusi

### Step 1: Fix Schema Profiles

Buka **Supabase SQL Editor**, jalankan query ini:

```sql
-- Rename kolom 'nama' menjadi 'nama_lengkap'
ALTER TABLE profiles RENAME COLUMN nama TO nama_lengkap;

-- Tambahkan kolom yang diperlukan
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nomor_telepon TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
```

### Step 2: Generate Password Hash

**Option A: Gunakan bcryptjs via Node.js**

Buat file `scripts/hash-password.js`:
```javascript
const bcrypt = require('bcryptjs');

const password = 'LapanClass2026';
const hash = bcrypt.hashSync(password, 10);

console.log('Password Hash:');
console.log(hash);
```

Run:
```bash
node scripts/hash-password.js
```

Copy hasilnya untuk query insert.

**Option B: Gunakan Online Tool**

1. Buka: https://bcrypt-generator.com/
2. Input: `LapanClass2026`
3. Rounds: `10`
4. Generate
5. Copy hash yang dihasilkan (contoh: `$2b$10$abc123...`)

**Option C: Gunakan Hash yang Sudah Saya Generate**

```
Password: LapanClass2026
Hash: $2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUvIapDduy
```

### Step 3: Insert Admin User

Di **Supabase SQL Editor**, jalankan:

```sql
INSERT INTO profiles (
  id, 
  nama_lengkap, 
  nomor_telepon,
  role, 
  custom_id, 
  password, 
  is_approved,
  is_blocked,
  class_id
)
VALUES (
  gen_random_uuid(), 
  'Super Admin',
  '08123456789',
  'admin', 
  'ADMIN-001', 
  '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUvIapDduy',
  TRUE,
  FALSE,
  NULL
);
```

### Step 4: Test Login

1. Buka `/login`
2. Tab "Pengurus & Admin"
3. Custom ID: `ADMIN-001`
4. Password: `LapanClass2026`
5. Login → Berhasil! ✅

---

## 🔍 Verify Schema

Setelah migrasi, pastikan tabel `profiles` punya kolom ini:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
```

Expected columns:
- `id` (uuid)
- `nama_lengkap` (text) ← **Penting!**
- `nomor_telepon` (text)
- `role` (text)
- `custom_id` (text, unique)
- `password` (text)
- `is_approved` (boolean)
- `is_blocked` (boolean)
- `class_id` (uuid, nullable)
- `created_at` (timestamp)

---

## 🐛 Troubleshooting

### Jika masih error setelah rename kolom:

**Refresh Supabase Schema Cache:**
```sql
-- Di Supabase SQL Editor
NOTIFY pgrst, 'reload schema';
```

Atau restart Supabase project via dashboard.

### Jika kolom 'nama' masih dipakai di tempat lain:

Jangan rename, tapi tambahkan kolom baru dan copy data:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nama_lengkap TEXT;
UPDATE profiles SET nama_lengkap = nama WHERE nama_lengkap IS NULL;
```

Lalu update kode untuk pakai `nama` instead of `nama_lengkap` (atau sebaliknya).

---

## 📝 Quick Reference

**Default Password**: `LapanClass2026`
**Hash (bcrypt round 10)**: `$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUvIapDduy`

**Admin Login Credentials:**
- Custom ID: `ADMIN-001`
- Password: `LapanClass2026`
