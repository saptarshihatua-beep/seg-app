const rateLimit = require('express-rate-limit');

// General API rate limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// Strict limiter for authentication (prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

// Verification attempts limiter (prevent brute-force coordinate scanning)
const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 attempts per 5 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many location verification requests. Please wait a moment.' }
});

module.exports = {
  generalLimiter,
  authLimiter,
  verifyLimiter
};
