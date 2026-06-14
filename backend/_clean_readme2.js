const fs = require('fs');
const path = require('path');

const readmePath = path.join(__dirname, '..', 'README.md');
let content = fs.readFileSync(readmePath, 'utf8');

// The original content had an issue with the env block getting deleted.
// Let's add the safe .env block back.

content = content.replace(
  'Buat file `backend/.env`:\n\n\nJalankan schema SQL untuk membuat tabel:',
  `Buat file \`backend/.env\`:

\`\`\`env
DATABASE_URL=postgresql://user:password@localhost:5432/it_ticketing_db
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
\`\`\`

Jalankan schema SQL untuk membuat tabel:`
);

fs.writeFileSync(readmePath, content, 'utf8');
console.log('Fixed env block');
