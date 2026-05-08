const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/sharing', require('./routes/sharing'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Ajaia Docs API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startDbKeepAlive();
});

// ── Keep Neon database alive ──────────────────────────────────────────────
function startDbKeepAlive() {
  const { prisma } = require('./lib/prisma');

  const ping = async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('[keep-alive] DB ping OK');
    } catch (e) {
      console.error('[keep-alive] DB ping failed:', e.message);
    }
  };

  // Ping immediately on startup
  ping();

  // Then ping every 4 minutes (Neon sleeps after 5 min on free tier)
  setInterval(ping, 4 * 60 * 1000);
}

module.exports = app;