// Script to hash student passwords in database
// Run this ONCE to migrate plain text passwords to bcrypt hashes

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// IMPORTANT: Replace with your actual Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function hashStudentPasswords() {
    console.log('🔐 Starting password hashing process...\n')

    try {
        // Get all students
        const { data: students, error } = await supabase
            .from('profiles')
            .select('id, nama, nis, password, role')
            .eq('role', 'siswa')

        if (error) {
            console.error('❌ Error fetching students:', error)
            return
        }

        console.log(`📊 Found ${students.length} students\n`)

        let updatedCount = 0
        let skippedCount = 0
        let errorCount = 0

        for (const student of students) {
            // Check if password is already hashed
            if (student.password.startsWith('$2a$') || student.password.startsWith('$2b$')) {
                console.log(`⏭️  Student ${student.nama} (${student.nis}) - Already hashed`)
                skippedCount++
                continue
            }

            try {
                // Hash the plain text password
                const salt = await bcrypt.genSalt(10)
                const hashedPassword = await bcrypt.hash(student.password, salt)

                // Update in database
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ password: hashedPassword })
                    .eq('id', student.id)

                if (updateError) {
                    console.error(`❌ Error updating ${student.nama}:`, updateError)
                    errorCount++
                } else {
                    console.log(`✅ Updated ${student.nama} (${student.nis}) - Password: ${student.password} → Hashed`)
                    updatedCount++
                }
            } catch (err) {
                console.error(`❌ Error hashing password for ${student.nama}:`, err)
                errorCount++
            }
        }

        console.log('\n' + '='.repeat(50))
        console.log('📈 Summary:')
        console.log(`   Total students: ${students.length}`)
        console.log(`   ✅ Updated: ${updatedCount}`)
        console.log(`   ⏭️  Skipped (already hashed): ${skippedCount}`)
        console.log(`   ❌ Errors: ${errorCount}`)
        console.log('='.repeat(50))

        if (updatedCount > 0) {
            console.log('\n✨ Password hashing completed successfully!')
            console.log('⚠️  Note: The plain text comparison fallback in auth-utils.ts')
            console.log('   can now be removed for better security.')
        }
    } catch (error) {
        console.error('❌ Fatal error:', error)
    }
}

// Run the script
hashStudentPasswords()
    .then(() => {
        console.log('\n✅ Script finished')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n❌ Script failed:', error)
        process.exit(1)
    })
