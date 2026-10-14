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
    const existing = await db.get("SELECT id, name, role FROM users WHERE email = ?", [normalizedEmail]);
    if (existing) {
      const assignedRole = role === 'sender' ? 'sender' : (role === 'receiver' ? 'receiver' : (existing.role || 'sender'));
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await db.run(
        "UPDATE users SET name = ?, password_hash = ?, role = ? WHERE id = ?",
        [name.trim(), passwordHash, assignedRole, existing.id]
      );

      const token = jwt.sign({ id: existing.id, email: normalizedEmail, role: assignedRole }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN
      });

      try {
        await db.run(
          "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
          [existing.id, 'USER_REAUTH', `User signed in / re-registered with existing email (${assignedRole})`, String(req.ip || req.connection?.remoteAddress || '').slice(0, 45)]
        );
      } catch (logErr) {}

      return res.status(200).json({
        message: 'Account authenticated successfully',
        token,
        user: {
          id: existing.id,
          name: name.trim(),
          email: normalizedEmail,
          role: assignedRole
        }
      });
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
    const userId = req.user?.id || 0;
    const receivers = await db.query(
      "SELECT id, name, email, role FROM users WHERE id != ? ORDER BY name ASC",
      [userId]
    );
    res.json({ receivers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch receivers list.' });
  }
}

async function deleteReceiver(req, res) {
  try {
    const param = (req.params.id || '').trim();
    if (!param) {
      return res.status(400).json({ error: 'Target identifier is required.' });
    }

    let targetUser = null;
    const numericId = parseInt(param, 10);
    if (!isNaN(numericId) && String(numericId) === param) {
      targetUser = await db.get("SELECT id, name, email FROM users WHERE id = ?", [numericId]);
    } else {
      targetUser = await db.get("SELECT id, name, email FROM users WHERE LOWER(email) = ?", [param.toLowerCase()]);
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'Recipient account not found.' });
    }

    // Do not delete currently logged in user
    if (req.user && req.user.id === targetUser.id) {
      return res.status(400).json({ error: 'Cannot delete your own active session account.' });
    }

    const targetId = targetUser.id;

    // Disconnect references in audit_logs
    try {
      await db.run("UPDATE audit_logs SET user_id = NULL WHERE user_id = ?", [targetId]);
    } catch (e) {}

    // Disconnect references in documents where user was receiver
    try {
      await db.run("UPDATE documents SET receiver_id = NULL WHERE receiver_id = ?", [targetId]);
    } catch (e) {}

    // Delete documents created by this user if any
    try {
      await db.run("DELETE FROM documents WHERE sender_id = ?", [targetId]);
    } catch (e) {}

    // Delete user from users table
    await db.run("DELETE FROM users WHERE id = ?", [targetId]);

    // Record audit event
    try {
      await db.run(
        "INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)",
        [req.user?.id || null, 'RECIPIENT_DELETED', `Deleted stocked recipient ${targetUser.email} (ID: ${targetId})`, String(req.ip || req.connection?.remoteAddress || '').slice(0, 45)]
      );
    } catch (e) {}

    res.json({
      message: `Stocked recipient ${targetUser.email} deleted successfully.`,
      deletedId: targetId,
      deletedEmail: targetUser.email
    });
  } catch (err) {
    console.error('[Delete Receiver Error]:', err);
    res.status(500).json({ error: 'Failed to delete recipient: ' + err.message });
  }
}

module.exports = {
  register,
  login,
  getMe,
  listReceivers,
  deleteReceiver
};
