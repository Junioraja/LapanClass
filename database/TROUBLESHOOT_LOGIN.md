# 🚨 SOLUSI LOGIN ERROR - Data Kosong Meskipun Ada di Database

## Masalah
Query return `data: []` (kosong) padahal data ada di Supabase.

**Penyebab:** Row Level Security (RLS) aktif dan memblokir query dari client.

---

## ✅ SOLUSI 1: Disable RLS (RECOMMENDED untuk Development)

### Jalankan di Supabase SQL Editor:

```sql
-- Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
-- rowsecurity harus FALSE
```

### Test Login Lagi:
1. Refresh page (Ctrl+F5)
2. Login dengan ADMINRPL + dediayambakar
3. Check console → `data: [...]` (ada isinya) ✅

---

## ✅ SOLUSI 2: Enable RLS dengan Policy yang Benar

Jika mau RLS tetap aktif (untuk production):

```sql
-- 1. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Buat policy untuk SELECT (allow semua)
CREATE POLICY "Allow public read access" ON profiles
  FOR SELECT USING (true);

-- 3. Buat policy untuk INSERT
CREATE POLICY "Allow public insert" ON profiles
  FOR INSERT WITH CHECK (true);

-- 4. Buat policy untuk UPDATE
CREATE POLICY "Allow users to update" ON profiles
  FOR UPDATE USING (true) WITH CHECK (true);
```

---

## 🔍 Debug Steps

### 1. Cek RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
```

### 2. Cek Policy yang Ada
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles';
```

### 3. Cek Data Manual
```sql
-- Query langsung di SQL Editor (bypass RLS)
SELECT id, nama, custom_id, is_approved, role 
FROM profiles 
WHERE custom_id = 'ADMINRPL';
```

---

## 📋 Checklist

- [ ] Jalankan `ALTABLE profiles DISABLE ROW LEVEL SECURITY;`
- [ ] Verify dengan query: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
- [ ] Refresh aplikasi (Ctrl+F5)
- [ ] Test login
- [ ] Check console log → data harus ada isi

---

## ⚡ Quick Command

Copypaste ke Supabase SQL Editor:

```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
SELECT id, nama, custom_id, is_approved, role FROM profiles WHERE custom_id = 'ADMINRPL';
```

Jalankan dan pastikan ada hasil! 🚀
