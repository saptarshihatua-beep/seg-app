require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'seg_super_secret_jwt_key_9837428492019482',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Database Configuration
  DB_TYPE: process.env.DB_TYPE || 'auto', // 'mysql', 'sqlite', or 'auto'
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'seg_geolocking',
  
  // Storage paths
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  KML_DIR: process.env.KML_DIR || 'uploads/kml',
  
  // Geolocation & Security Defaults
  MAX_LOCATION_AGE_SECONDS: parseInt(process.env.MAX_LOCATION_AGE_SECONDS || '60', 10),
  MAX_ALLOWED_ACCURACY_METERS: parseInt(process.env.MAX_ALLOWED_ACCURACY_METERS || '150', 10),
  TOKEN_EXPIRY_MINUTES: parseInt(process.env.TOKEN_EXPIRY_MINUTES || '60', 10),
  
  // Client URL for CORS and Links
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};
