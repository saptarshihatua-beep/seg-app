const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

let dbDriver = null; // 'mysql' or 'sqlite'
let mysqlPool = null;
let sqliteDb = null;

const SQLITE_FILE = path.join(__dirname, 'seg_local.sqlite');

/**
 * Initialize unified database
 */
async function initDb() {
  if (env.DB_TYPE === 'mysql' || env.DB_TYPE === 'auto') {
    try {
      const mysql = require('mysql2/promise');
      const tempConn = await mysql.createConnection({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        connectTimeout: 2000
      });
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\``);
      await tempConn.end();

      mysqlPool = mysql.createPool({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Test connection
      const conn = await mysqlPool.getConnection();
      conn.release();
      dbDriver = 'mysql';
      console.log(`[DB] Connected successfully to MySQL (${env.DB_NAME} at ${env.DB_HOST})`);
      await initMySQLTables();
      await seedInitialData();
      return;
    } catch (err) {
      if (env.DB_TYPE === 'mysql') {
        console.error('[DB] Failed to connect to MySQL:', err.message);
        throw err;
      }
      console.log(`[DB] MySQL not available (${err.message}). Falling back to local SQLite engine.`);
    }
  }

  // SQLite Fallback
  const sqlite3 = require('sqlite3').verbose();
  await new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(SQLITE_FILE, (err) => {
      if (err) return reject(err);
      dbDriver = 'sqlite';
      console.log(`[DB] Connected successfully to SQLite database at: ${SQLITE_FILE}`);
      resolve();
    });
  });

  await initSQLiteTables();
  await seedInitialData();
}

/**
 * Initialize MySQL tables from schema
 */
async function initMySQLTables() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const rawSql = fs.readFileSync(schemaPath, 'utf8');
    const statements = rawSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().startsWith('create database') && !s.toLowerCase().startsWith('use '));

    for (const sql of statements) {
      try {
        await mysqlPool.query(sql);
      } catch (err) {
        console.warn('[DB MySQL Init warning]:', err.message);
      }
    }
  }
}

/**
 * Initialize SQLite tables with equivalent schemas
 */
async function initSQLiteTables() {
  const tableStatements = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'receiver',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NULL,
      receiver_email TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      encrypted_file_reference TEXT NOT NULL,
      encryption_metadata TEXT NOT NULL,
      location_address TEXT NOT NULL,
      polygon_coordinates TEXT NOT NULL,
      kml_reference TEXT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS access_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS location_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      receiver_id INTEGER NULL,
      verification_method TEXT NOT NULL,
      verification_result TEXT NOT NULL,
      verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NULL,
      action TEXT NOT NULL,
      document_id INTEGER NULL,
      details TEXT NULL,
      ip_address TEXT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
    )`
  ];

  for (const sql of tableStatements) {
    await run(sql);
  }
}

/**
 * Seed initial test users and sample document if empty
 */
async function seedInitialData() {
  const existing = await query("SELECT COUNT(*) as cnt FROM users");
  const count = existing[0]?.cnt || 0;
  if (count === 0) {
    console.log('[DB] Seeding default test credentials...');
    const salt = await bcrypt.genSalt(10);
    const senderHash = await bcrypt.hash('Sender123!', salt);
    const receiverHash = await bcrypt.hash('Receiver123!', salt);
    const edwardHash = await bcrypt.hash('Edward123!', salt);
    const ashishHash = await bcrypt.hash('Ashish123!', salt);

    await run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['Dr. Edward Chow', 'edward@chow-s.com', edwardHash, 'sender']
    );
    await run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['Ashish Korpe', 'ashish@uccs.edu', ashishHash, 'receiver']
    );
    await run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['Alice Vance (Sender)', 'alice.sender@uccs.edu', senderHash, 'sender']
    );
    await run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['Bob Miller (Receiver)', 'bob.receiver@uccs.edu', receiverHash, 'receiver']
    );
    console.log('[DB] Default test users created successfully.');
  }
}

/**
 * Standard query returning an array of rows
 */
async function query(sql, params = []) {
  if (dbDriver === 'mysql') {
    const [rows] = await mysqlPool.query(sql, params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  }
}

/**
 * Standard get returning a single row
 */
async function get(sql, params = []) {
  if (dbDriver === 'mysql') {
    const [rows] = await mysqlPool.query(sql, params);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  }
}

/**
 * Run an INSERT, UPDATE, or DELETE query
 */
async function run(sql, params = []) {
  if (dbDriver === 'mysql') {
    const [result] = await mysqlPool.query(sql, params);
    return { insertId: result.insertId, changes: result.affectedRows };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ insertId: this.lastID, changes: this.changes });
      });
    });
  }
}

function getDriver() {
  return dbDriver;
}

module.exports = {
  initDb,
  query,
  get,
  run,
  getDriver
};
