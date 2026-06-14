const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');
let content = fs.readFileSync(readmePath, 'utf8');

// 1. Remove the sentence about passwords in the seed step
content = content.replace(
  'Data seed berisi 3 akun petugas dan 7 tiket contoh. Semua akun menggunakan password default `password123`.',
  'Data seed berisi beberapa akun petugas dan tiket contoh untuk keperluan pengembangan lokal.'
);

// 2. Anonymize the curl login example
content = content.replace(
  `  -d '{"username": "andri_admin", "password": "password123"}'`,
  `  -d '{"username": "admin_user", "password": "yourpassword"}'`
);

// 3. Update JWT_SECRET example in the Environment Variables table
content = content.replace(
  /\| \`JWT_SECRET\` \| ❌ \| \`supersecretjwt...\` \| Secret key untuk JWT \|/,
  '| `JWT_SECRET` | ❌ | `(random string)` | Secret key untuk penandatanganan JWT |'
);

// 4. Remove the "Akun Default (Seed)" section entirely
const seedSectionRegex = /## Akun Default \(Seed\)\n\n\| Username \| Password \| Nama \| Role \|\n\|----------\|----------\|------\|------\|\n\| \`andri_admin\` \| \`password123\` \| Andri Hermawan \| Admin \|\n\| \`budi_support\` \| \`password123\` \| Budi Santoso \| Admin \|\n\| \`citra_it\` \| \`password123\` \| Citra Lestari \| Admin \|\n\n/;
content = content.replace(seedSectionRegex, '');

fs.writeFileSync(readmePath, content, 'utf8');
console.log('README updated successfully to remove sensitive data.');
