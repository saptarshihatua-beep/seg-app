const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { initDb, getDriver } = require('./db/db');
const { generalLimiter } = require('./middleware/rateLimiter');

// Initialize directories
const uploadDir = path.resolve(__dirname, env.UPLOAD_DIR);
const kmlDir = path.resolve(__dirname, env.KML_DIR);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(kmlDir)) fs.mkdirSync(kmlDir, { recursive: true });

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allow loading KML and assets across ports
}));
app.use(cors({
  origin: '*', // Allow frontend dev server
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Apply general rate limiting
app.use('/api/', generalLimiter);

// Static routes
app.use('/uploads/kml', express.static(kmlDir));

// Healthcheck & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Secure Enhanced Geolocking (SEG) API v2.0',
    dbDriver: getDriver(),
    timestamp: new Date().toISOString(),
    nodeEnv: env.NODE_ENV,
    storage: {
      uploadDir: env.UPLOAD_DIR,
      kmlDir: env.KML_DIR
    }
  });
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/documents', require('./routes/documentRoutes'));
app.use('/api/verify', require('./routes/verifyRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
async function startServer() {
  try {
    await initDb();
    app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(`   SECURE ENHANCED GEOLOCKING (SEG) BACKEND SERVER    `);
      console.log(`   Running on http://localhost:${env.PORT}             `);
      console.log(`   Database Engine: [${getDriver()?.toUpperCase()}]     `);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
