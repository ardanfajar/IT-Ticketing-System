const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// Normalize to LF for easier regex
c = c.replace(/\r\n/g, '\n');

// 1. Remove socket.io-client import
c = c.replace("import { io } from 'socket.io-client';\n", '');

// 2. Remove SOCKET_URL constant
c = c.replace("const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';\n", '');

// 3. Remove LogEntry interface
c = c.replace(/interface LogEntry \{[^}]*\}\n\n/, '');

// 4. Remove socketLogs state block
c = c.replace(/  \/\/ State Notifikasi & Simulasi Socket\.IO Logs\n  const \[socketLogs, setSocketLogs\][^\n]*\n[^\n]*\n  \]\);\n/, '  // State Notifikasi\n');

// 5. Remove addSocketLog function
c = c.replace(/  \/\/ === AUXILIARY: LOGS ===\n  const addSocketLog[^}]*\};\n  \};\n\n/, '');

// 6. Remove Socket.IO useEffect block
const socketUseEffectStart = c.indexOf('  // === REAL-TIME SYNC (SOCKET.IO CLIENT) ===');
if (socketUseEffectStart !== -1) {
  const afterStart = c.indexOf('  }, []);\n', socketUseEffectStart);
  if (afterStart !== -1) {
    const endPos = afterStart + '  }, []);\n'.length;
    c = c.substring(0, socketUseEffectStart) + c.substring(endPos);
  }
}

// 7. Remove all addSocketLog() calls
c = c.replace(/.*addSocketLog\([^)]*\);\n/g, '');

// 8. In simulateNewTicketTrigger, add fetchTickets/fetchStaff after success
c = c.replace(
  "      if (res.ok) {\n        setNewTicketMsg('');\n        setShowAddModal(false);",
  "      if (res.ok) {\n        setNewTicketMsg('');\n        setShowAddModal(false);\n        fetchTickets();\n        fetchStaff();\n        triggerBannerNotification('Tiket baru berhasil dibuat!');"
);

// 9. Update the modal info text
c = c.replace(
  /Tindakan ini membuat tiket baru langsung di database PostgreSQL dan menyiarkan event pembaruan secara real-time ke semua dashboard petugas aktif via Socket\.IO\./,
  'Tindakan ini membuat tiket baru langsung di database PostgreSQL.'
);

// 10. Update analytics PostgreSQL widget text + remove code tag
const pgWidgetOld = `                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Mekanisme PostgreSQL Notifikasi</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                    Setiap perubahan di atas dikirimkan dari server melalui PostgreSQL trigger <code className="bg-gray-100 dark:bg-slate-950 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 text-[10px]">pg_notify('ticket_update', ...)</code> dan dipancarkan ke frontend menggunakan Socket.IO.
                  </p>`;
const pgWidgetNew = `                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1">Informasi Sistem</h4>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                    Setiap perubahan data tercatat di database PostgreSQL dan ditampilkan secara otomatis di dashboard.
                  </p>`;
c = c.replace(pgWidgetOld, pgWidgetNew);

// 11. Update notification banner header
c = c.replace('Notifikasi Real-time', 'Notifikasi');

// 12. Update PDF text
c = c.replace(
  "doc.text('Sistem Real-Time Terintegrasi (Express, PostgreSQL, Socket.IO)', 15, 30);",
  "doc.text('Sistem Terintegrasi (Express, PostgreSQL)', 15, 30);"
);

// Convert back to CRLF
c = c.replace(/\n/g, '\r\n');

fs.writeFileSync(filePath, c, 'utf8');
console.log('App.tsx updated successfully');

// Verify no socket references remain
const remaining = c.match(/socket|Socket\.IO/gi);
if (remaining) {
  console.log('WARNING: remaining socket references:', remaining);
} else {
  console.log('All socket references removed!');
}
