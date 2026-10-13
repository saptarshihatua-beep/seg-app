const rateLimit = require('express-rate-limit');

// General API rate limiter (allows 100,000+ requests per 15 min window)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

// Authentication limiter (allows users with the same email/IP to sign in 1000+ times without lockout)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

// Verification limiter
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many location verification requests. Please wait a moment.' }
});

module.exports = {
  generalLimiter,
  authLimiter,
  verifyLimiter
};
