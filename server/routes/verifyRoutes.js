const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');
const { verifyLimiter } = require('../middleware/rateLimiter');

// Issue replay-resistant challenge nonce
router.post('/challenge', verifyController.issueChallenge);

// Verify location and authorize document download
router.post('/authorize', verifyLimiter, verifyController.verifyAndAuthorize);

module.exports = router;
