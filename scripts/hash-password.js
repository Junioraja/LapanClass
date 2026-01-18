// Script untuk generate password hash menggunakan bcryptjs
// Gunakan: node scripts/hash-password.js [password]

const bcrypt = require('bcryptjs');

// Get password from command line or use default
const password = process.argv[2] || 'LapanClass2026';

// Generate hash dengan 10 rounds (sama dengan auth-utils.ts)
const hash = bcrypt.hashSync(password, 10);

console.log('=====================================');
console.log('Password Hash Generator (bcryptjs)');
console.log('=====================================');
console.log('');
console.log('Password:', password);
console.log('');
console.log('Hash:');
console.log(hash);
console.log('');
console.log('=====================================');
console.log('Copy hash di atas untuk digunakan di database');
console.log('=====================================');
