const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../db/db');

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await db.get("SELECT id, name, email, role FROM users WHERE id = ?", [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired authentication session.' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(req.user.role) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${roles.join(', ')}`
      });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
