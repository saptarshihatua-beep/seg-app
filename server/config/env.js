const path = require('path');
const os = require('os');
require('dotenv').config();

const isVercel = !!process.env.VERCEL;

// Resolve safe writable directories across local and serverless environments
const defaultUploadDir = isVercel 
  ? path.join(os.tmpdir(), 'seg_uploads') 
  : path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

const defaultKmlDir = isVercel 
  ? path.join(os.tmpdir(), 'seg_uploads', 'kml') 
  : path.resolve(__dirname, '..', process.env.KML_DIR || 'uploads/kml');

const DEV_JWT_SECRET = 'seg_super_secret_jwt_key_9837428492019482';

// Required settings when running on Vercel (serverless). Local dev keeps zero-config defaults.
const missingProductionConfig = [];
if (isVercel) {
  if (!process.env.JWT_SECRET) missingProductionConfig.push('JWT_SECRET');
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.MYSQL_URL && process.env.DB_TYPE !== 'mysql') {
    missingProductionConfig.push('DATABASE_URL (PostgreSQL, e.g. Supabase or Neon)');
  }
}

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // The dev fallback is public (it is in the repo), so it is never used on Vercel.
  JWT_SECRET: process.env.JWT_SECRET || (isVercel ? null : DEV_JWT_SECRET),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  MISSING_PRODUCTION_CONFIG: missingProductionConfig,
  
  // Database Configuration
  // Detects PostgreSQL (Supabase / Neon), MySQL, or SQLite
  DB_TYPE: process.env.DB_TYPE || (process.env.DATABASE_URL || process.env.POSTGRES_URL ? 'postgres' : (process.env.MYSQL_URL ? 'mysql' : 'auto')),
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || null,
  MYSQL_URL: process.env.MYSQL_URL || null,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'seg_geolocking',
  
  // Storage paths (Serverless-safe in /tmp when on Vercel)
  UPLOAD_DIR: defaultUploadDir,
  KML_DIR: defaultKmlDir,
  
  // Geolocation & Security Defaults
  MAX_LOCATION_AGE_SECONDS: parseInt(process.env.MAX_LOCATION_AGE_SECONDS || '60', 10),
  MAX_ALLOWED_ACCURACY_METERS: parseInt(process.env.MAX_ALLOWED_ACCURACY_METERS || '150', 10),
  TOKEN_EXPIRY_MINUTES: parseInt(process.env.TOKEN_EXPIRY_MINUTES || '60', 10),
  
  // Client URL for CORS and Share Links
  CLIENT_URL: process.env.CLIENT_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'),
  IS_VERCEL: isVercel
};
