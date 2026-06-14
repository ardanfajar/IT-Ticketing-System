const fs = require('fs');
const path = require('path');

// 1. Remove socket.io-client from frontend/package.json
const fePkgPath = path.join(__dirname, '..', 'frontend', 'package.json');
const fePkg = JSON.parse(fs.readFileSync(fePkgPath, 'utf8'));
delete fePkg.dependencies['socket.io-client'];
fs.writeFileSync(fePkgPath, JSON.stringify(fePkg, null, 2) + '\n', 'utf8');
console.log('frontend/package.json: removed socket.io-client');

// 2. Remove socket.io from backend/package.json
const bePkgPath = path.join(__dirname, 'package.json');
const bePkg = JSON.parse(fs.readFileSync(bePkgPath, 'utf8'));
delete bePkg.dependencies['socket.io'];
fs.writeFileSync(bePkgPath, JSON.stringify(bePkg, null, 2) + '\n', 'utf8');
console.log('backend/package.json: removed socket.io');

// 3. Clean up backend/server.js - remove Socket.IO and LISTEN/NOTIFY
const serverPath = path.join(__dirname, 'server.js');
let s = fs.readFileSync(serverPath, 'utf8');
s = s.replace(/\r\n/g, '\n');

// Remove http and Server imports
s = s.replace("const http = require('http');\n", '');
s = s.replace("const { Server } = require('socket.io');\n", '');
s = s.replace("const { Client } = require('pg');\n", '');

// Remove http server creation
s = s.replace("const server = http.createServer(app);\n\n", '');

// Remove the entire LISTEN/NOTIFY block
const listenStart = s.indexOf('// ------------------------------------------------------------------\n// POSTGRESQL LISTEN/NOTIFY');
const listenEnd = s.indexOf("// Socket.IO Server Setup\n");
if (listenStart !== -1 && listenEnd !== -1) {
  // Find the end of the Socket.IO + notification forwarding section
  const forwardEnd = s.indexOf("// ------------------------------------------------------------------\n// JWT AUTH MIDDLEWARE");
  if (forwardEnd !== -1) {
    s = s.substring(0, listenStart) + s.substring(forwardEnd);
  }
}

// Change server.listen to app.listen
s = s.replace('server.listen(PORT', 'app.listen(PORT');

s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(serverPath, s, 'utf8');
console.log('backend/server.js: cleaned up');

// Verify
const remaining = s.match(/socket|Socket\.IO|LISTEN|NOTIFY|pgClient/gi);
const filtered = remaining ? remaining.filter(r => !['listen'].includes(r.toLowerCase()) || r === 'LISTEN') : null;
console.log('Remaining refs in server.js:', filtered || 'NONE');
