# Setup Instructions - LapanClass

## ⚠️ PENTING: Install Dependencies

Sebelum menjalankan aplikasi, install package `bcryptjs` terlebih dahulu:

### Option 1: Unlock PowerShell (Recommended)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Kemudian install:
```bash
npm install bcryptjs @types/bcryptjs
```

### Option 2: Gunakan CMD/Git Bash
Jika PowerShell masih bermasalah, gunakan Command Prompt atau Git Bash:
```bash
npm install bcryptjs @types/bcryptjs
```

---

## 🚀 Run Development Server

```bash
npm run dev
```

Buka browser: `http://localhost:3000`

---

## 📋 Pages Yang Sudah Dibuat

1. **Landing Page**: `http://localhost:3000/` atau `http://localhost:3000`
2. **Login**: `http://localhost:3000/login`
3. **Register**: `http://localhost:3000/register`

---

## 🧪 Testing Flow

### 1. Test Register
1. Buka `/register`
2. Isi form pendaftaran
3. Submit → akan muncul success message
4. **PENTING**: User baru belum bisa login karena `is_approved = false`

### 2. Manual Approval (Via Supabase Dashboard)
Karena Admin Dashboard belum dibuat, approval manual via Supabase:

1. Buka Supabase Dashboard
2. Ke table `profiles`
3. Cari user yang baru didaftar
4. Edit row:
   - `is_approved` → `true`
   - `custom_id` → `"TEST-001"` (atau ID apapun)
5. Save

### 3. Test Login
1. Buka `/login`
2. Tab "Pengurus & Admin"
3. Custom ID: `TEST-001` (sesuai yang dibuat di step 2)
4. Password: (password yang diinput saat register)
5. Login → akan redirect sesuai role

---

## ⚠️ Known Issues

1. **bcryptjs not installed** - Perlu install manual (lihat instruksi di atas)
2. **Admin Dashboard belum ada** - Approval user masih manual via Supabase
3. **Dashboard pages belum dibuat** - Redirect setelah login akan error (normal, belum dibuat)

---

## 📁 Files Created

### Core Files
- `lib/types.ts` - Updated dengan multi-class types
- `lib/auth-utils.ts` - Authentication utilities
- `lib/class-utils.ts` - Class query utilities
- `contexts/AuthContext.tsx` - Auth state management
- `components/ProtectedRoute.tsx` - Route protection

### Pages
- `app/(public)/page.tsx` - Landing page
- `app/(auth)/login/page.tsx` - Login page (2 tabs)
- `app/(auth)/register/page.tsx` - Register page
- `app/(public)/layout.tsx` - Public layout
- `app/(auth)/layout.tsx` - Auth layout
- `app/layout.tsx` - Updated root layout

---

## 🔜 Next Steps

1. Install bcryptjs
2. Test landing page, register, dan login
3. Siap untuk fase berikutnya (Admin Dashboard & Dashboard Sekretaris)
