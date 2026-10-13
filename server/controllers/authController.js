const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/db');
const env = require('../config/env');

async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await db.get("SELECT id FROM users WHERE email = ?", [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const assignedRole = role === 'sender' ? 'sender' : 'receiver';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await db.run(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name.trim(), normalizedEmail, passwordHash, assignedRole]
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email: normalizedEmail, role: assignedRole }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    // Log audit event
    await db.run(
      "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
      [userId, 'USER_REGISTERED', `User registered with role ${assignedRole}`, req.ip || req.connection?.remoteAddress]
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: assignedRole
      }
    });
  } catch (err) {
    console.error('[Register Error]:', err);
    res.status(500).json({ error: 'Failed to complete registration.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.get("SELECT * FROM users WHERE email = ?", [normalizedEmail]);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      try {
        await db.run(
          "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
          [user.id, 'LOGIN_FAILED', 'Invalid password attempt', String(req.ip || req.connection?.remoteAddress || '').slice(0, 45)]
        );
      } catch (logErr) {
        console.warn('[Audit Log Warning]:', logErr.message);
      }
      return res.status(401).json({ error: 'Invalid email or password credentials.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN
    });

    // Log successful login
    try {
      await db.run(
        "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
        [user.id, 'LOGIN_SUCCESS', `User logged in from ${req.ip || 'remote'}`, String(req.ip || req.connection?.remoteAddress || '').slice(0, 45)]
      );
    } catch (logErr) {
      console.warn('[Audit Log Warning]:', logErr.message);
    }

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[Login Error]:', err);
    res.status(500).json({ error: 'An error occurred during authentication.' });
  }
}

async function getMe(req, res) {
  try {
    const user = await db.get("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}

async function listReceivers(req, res) {
  try {
    const receivers = await db.query(
      "SELECT id, name, email FROM users WHERE role = 'receiver' OR role = 'admin' ORDER BY name ASC"
    );
    res.json({ receivers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receivers list.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  listReceivers
};
