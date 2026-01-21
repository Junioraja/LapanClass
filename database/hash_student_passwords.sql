-- ============================================
-- HASH STUDENT PASSWORDS
-- ============================================
-- This script hashes plain text passwords for students
-- Run this ONCE to migrate existing plain text passwords to bcrypt hashes

-- IMPORTANT: Backup your database before running this!

-- Option 1: Hash all student passwords that are currently plain text
-- This will hash the password 'siswa123' for all students

-- First, check which passwords are plain text (bcrypt hashes start with $2a$ or $2b$)
SELECT 
  id,
  nama,
  nis,
  password,
  CASE 
    WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 'Hashed'
    ELSE 'Plain Text'
  END AS password_type
FROM profiles
WHERE role = 'siswa';

-- ============================================
-- MANUAL HASH GENERATION
-- ============================================
-- You need to generate bcrypt hashes using Node.js or online tool
-- Example using Node.js:

/*
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'siswa123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Hashed password:', hash);
}

hashPassword();
*/

-- Example hashed password for 'siswa123':
-- $2a$10$YourHashedPasswordHere

-- ============================================
-- UPDATE PASSWORDS (Run after generating hash)
-- ============================================

-- Replace 'YOUR_BCRYPT_HASH_HERE' with the actual bcrypt hash generated above
-- Example:
-- UPDATE profiles 
-- SET password = '$2a$10$YourActualHashHere'
-- WHERE role = 'siswa' AND (password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%');

-- ============================================
-- ALTERNATIVE: Create Node.js script
-- ============================================
-- Create a file: scripts/hash-student-passwords.js

/*
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_SERVICE_KEY'; // Use service role key!

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashStudentPasswords() {
  // Get all students with plain text passwords
  const { data: students, error } = await supabase
    .from('profiles')
    .select('id, password')
    .eq('role', 'siswa');

  if (error) {
    console.error('Error fetching students:', error);
    return;
  }

  console.log(`Found ${students.length} students`);

  for (const student of students) {
    // Check if password is already hashed
    if (student.password.startsWith('$2a$') || student.password.startsWith('$2b$')) {
      console.log(`Student ${student.id} already has hashed password`);
      continue;
    }

    // Hash the plain text password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(student.password, salt);

    // Update in database
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ password: hashedPassword })
      .eq('id', student.id);

    if (updateError) {
      console.error(`Error updating student ${student.id}:`, updateError);
    } else {
      console.log(`✓ Updated student ${student.id}`);
    }
  }

  console.log('Done!');
}

hashStudentPasswords();
*/

-- ============================================
-- VERIFICATION
-- ============================================
-- After running the update, verify all passwords are hashed:

SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN password LIKE '$2a$%' OR password LIKE '$2b$%' THEN 1 END) as hashed_passwords,
  COUNT(CASE WHEN password NOT LIKE '$2a$%' AND password NOT LIKE '$2b$%' THEN 1 END) as plain_text_passwords
FROM profiles
WHERE role = 'siswa';

-- Expected result: plain_text_passwords should be 0
