const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.tsx');
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(/\r\n/g, '\n');

// Remove the addSocketLog function block
const marker = '  // === AUXILIARY: LOGS ===\n';
const start = c.indexOf(marker);
if (start !== -1) {
  // Find the closing of the function: "  };\n\n"
  const funcEnd = c.indexOf('  };\n\n  // === SESSION CHECK', start);
  if (funcEnd !== -1) {
    c = c.substring(0, start) + c.substring(funcEnd + '  };\n\n'.length);
    console.log('addSocketLog function removed');
  } else {
    console.log('Could not find end of addSocketLog function');
  }
} else {
  console.log('addSocketLog marker not found');
}

c = c.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, c, 'utf8');

// Final check
const remaining = c.match(/socket|Socket/gi);
console.log('Remaining socket refs:', remaining || 'NONE');
