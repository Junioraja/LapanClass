// Generate correct bcrypt hash for 'siswa123'
const bcrypt = require('bcryptjs')

async function generateHash() {
    const password = 'siswa123'

    console.log('Generating bcrypt hash for password:', password)
    console.log('Please wait...\n')

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    console.log('✅ Hash generated successfully!')
    console.log('\nPassword:', password)
    console.log('Hash:', hash)
    console.log('\nSQL Query to update students_master:')
    console.log('=====================================')
    console.log(`UPDATE students_master`)
    console.log(`SET password = '${hash}'`)
    console.log(`WHERE LENGTH(password) < 50 OR password NOT LIKE '$2a$%';`)
    console.log('=====================================')

    // Verify the hash works
    console.log('\n🔍 Verifying hash...')
    const isValid = await bcrypt.compare(password, hash)
    console.log('Verification result:', isValid ? '✅ VALID' : '❌ INVALID')

    if (isValid) {
        console.log('\n✨ Success! Copy the SQL query above and run it in Supabase SQL Editor.')
    }
}

generateHash()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Error:', err)
        process.exit(1)
    })
