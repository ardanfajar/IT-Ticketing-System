const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Client } = require('pg');
const db = require('./db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkeyforticketing2026';

// ------------------------------------------------------------------
// POSTGRESQL LISTEN/NOTIFY FOR REAL-TIME SYNC via SOCKET.IO
// ------------------------------------------------------------------
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL
});

pgClient.connect()
  .then(() => {
    console.log('PostgreSQL Client connected for LISTEN/NOTIFY');
    return pgClient.query('LISTEN ticket_update');
  })
  .then(() => {
    console.log('Successfully listening to channel "ticket_update"');
  })
  .catch(err => {
    console.error('Failed to set up PG LISTEN client:', err);
  });

// Socket.IO Server Setup
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Forward database notifications to Socket.IO clients
pgClient.on('notification', (msg) => {
  console.log(`PG Notification received on channel: ${msg.channel}`);
  try {
    const payload = JSON.parse(msg.payload);
    console.log('Broadcast event "ticketChanged" with payload:', payload);
    io.emit('ticketChanged', payload);
  } catch (err) {
    console.error('Error parsing pg_notify payload:', err);
  }
});

// ------------------------------------------------------------------
// JWT AUTH MIDDLEWARE
// ------------------------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Akses ditolak. Token tidak ditemukan.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Sesi kedaluwarsa atau token tidak valid.' });
    }
    req.user = user;
    next();
  });
};

// ------------------------------------------------------------------
// API ENDPOINTS
// ------------------------------------------------------------------

// Root Route
app.get('/', (req, res) => {
  res.send('<h2>IT Ticketing System Backend API is running.</h2><p>Please access the Frontend web application at <a href="http://127.0.0.1:5173">http://127.0.0.1:5173</a> or <a href="http://localhost:5173">http://localhost:5173</a>.</p>');
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Authenticate and Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kredensial tidak valid.' });
    }

    const dbUser = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Kredensial tidak valid.' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: dbUser.id,
        username: dbUser.username,
        name: dbUser.name,
        role: dbUser.role,
        avatar: dbUser.avatar
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      id: dbUser.id,
      username: dbUser.username,
      name: dbUser.name,
      role: dbUser.role,
      avatar: dbUser.avatar,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Terjadi kesalahan sistem saat login.' });
  }
});

// Verify Current Session
app.get('/api/users/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Get Staff / Users performance
app.get('/api/staff', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, name, role, avatar, completed_count AS "completedCount" FROM users ORDER BY completed_count DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: 'Gagal memuat daftar petugas.' });
  }
});

// Get All Tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tickets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tickets:', err);
    res.status(500).json({ error: 'Gagal memuat daftar tiket.' });
  }
});

// Create Ticket (Simulate API / Bot)
app.post('/api/tickets', async (req, res) => {
  const { source, message } = req.body;
  if (!source || !message) {
    return res.status(400).json({ error: 'Sumber tiket dan pesan wajib diisi.' });
  }

  try {
    // Generate ticket number
    const countResult = await db.query('SELECT COUNT(*) FROM tickets');
    const totalTickets = parseInt(countResult.rows[0].count);
    const ticketNum = `TCK-2026-${String(totalTickets + 101).padStart(3, '0')}`;

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const result = await db.query(
      `INSERT INTO tickets (ticket_number, source, message, status, created_at, updated_at) 
       VALUES ($1, $2, $3, 'belum_dikerjakan', $4, $5) 
       RETURNING *`,
      [ticketNum, source, message, nowStr, nowStr]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating ticket:', err);
    res.status(500).json({ error: 'Gagal membuat tiket baru.' });
  }
});

// Update Ticket Status (Protected)
app.patch('/api/tickets/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !['belum_dikerjakan', 'diproses', 'selesai', 'ditolak'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  try {
    // Check if ticket exists
    const ticketCheck = await db.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Tiket tidak ditemukan.' });
    }

    const ticket = ticketCheck.rows[0];
    const isCompleted = status === 'selesai';
    const isCancelled = status === 'ditolak';
    const completedBy = isCompleted || isCancelled ? req.user.name : null;
    const completedAt = isCompleted || isCancelled ? new Date().toISOString().replace('T', ' ').slice(0, 16) : null;
    const updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Update ticket
    const updateResult = await db.query(
      `UPDATE tickets 
       SET status = $1, completed_by = $2, completed_at = $3, updated_at = $4 
       WHERE id = $5 
       RETURNING *`,
      [status, completedBy, completedAt, updatedAt, id]
    );

    // Note: completed_count increment/decrement is handled automatically at database level by notify_ticket_changes() trigger function.

    res.json(updateResult.rows[0]);
  } catch (err) {
    console.error('Error updating ticket:', err);
    res.status(500).json({ error: 'Gagal memperbarui status tiket.' });
  }
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
