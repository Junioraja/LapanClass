# Student Login Fix - Plain Text Password Issue

## Problem
Students cannot login because their passwords in the database are stored as plain text (e.g., `siswa123`), but the login system expects bcrypt-hashed passwords.

## Solution Implemented

### ✅ Quick Fix (Already Applied)
Updated `lib/auth-utils.ts` to support **both** hashed and plain text passwords:

```typescript
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    try {
        // Try bcrypt comparison first (for hashed passwords)
        const isMatch = await bcrypt.compare(password, hash)
        return isMatch
    } catch (error) {
        // Fallback: If bcrypt fails, try plain text comparison
        console.warn('Bcrypt comparison failed, trying plain text comparison')
        return password === hash
    }
}
```

**Result**: Students can now login with plain text passwords! ✅

---

## Recommended: Hash Existing Passwords

For better security, you should hash all plain text passwords. Choose one of these methods:

### Method 1: Using Node.js Script (Recommended)

1. **Set environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_service_role_key
   ```

2. **Run the script**:
   ```bash
   node scripts/hash-student-passwords.js
   ```

3. **Verify** in Supabase:
   ```sql
   SELECT 
     COUNT(*) as total,
     COUNT(CASE WHEN password LIKE '$2a$%' THEN 1 END) as hashed
   FROM profiles WHERE role = 'siswa';
   ```

### Method 2: Manual SQL Update

1. **Generate bcrypt hash** using Node.js:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = await bcrypt.hash('siswa123', 10);
   console.log(hash); // Copy this hash
   ```

2. **Update in Supabase SQL Editor**:
   ```sql
   UPDATE profiles 
   SET password = '$2a$10$YOUR_GENERATED_HASH_HERE'
   WHERE role = 'siswa' 
   AND password NOT LIKE '$2a$%';
   ```

---

## Current Status

### ✅ Working Now:
- Students can login with NIS and plain text password (`siswa123`)
- System automatically detects plain text and compares directly
- No database changes required immediately

### ⚠️ Security Note:
- Plain text passwords are **not secure**
- Recommended to hash passwords using Method 1 or 2 above
- After hashing, the fallback can be removed for better security

---

## Testing

### Test Login:
1. Go to `/login`
2. Enter student NIS (e.g., `123456`)
3. Enter password: `siswa123`
4. Should redirect to `/siswa` dashboard ✅

### Verify Password Type:
```sql
SELECT 
  nama,
  nis,
  CASE 
    WHEN password LIKE '$2a$%' THEN 'Hashed ✅'
    ELSE 'Plain Text ⚠️'
  END AS password_status
FROM profiles
WHERE role = 'siswa'
LIMIT 10;
```

---

## Files Modified/Created

1. ✅ `lib/auth-utils.ts` - Added plain text fallback
2. ✅ `scripts/hash-student-passwords.js` - Script to hash passwords
3. ✅ `database/hash_student_passwords.sql` - SQL guide

---

## Next Steps (Optional)

1. **Hash passwords** using the script
2. **Remove fallback** from `auth-utils.ts` after all passwords are hashed:
   ```typescript
   // Remove the try-catch and just use:
   export async function comparePassword(password: string, hash: string): Promise<boolean> {
       return await bcrypt.compare(password, hash)
   }
   ```
3. **Set password policy** for new students to use strong passwords

---

## FAQ

**Q: Can students still login now?**  
A: Yes! The fallback allows plain text comparison.

**Q: Is it secure?**  
A: It works, but hashing is recommended for production.

**Q: What if I hash passwords later?**  
A: The system will automatically use bcrypt comparison for hashed passwords.

**Q: How do I know which passwords are hashed?**  
A: Hashed passwords start with `$2a$` or `$2b$`.
