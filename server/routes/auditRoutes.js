const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/logs', authenticateToken, auditController.getAuditLogs);
router.get('/stats', authenticateToken, auditController.getSystemStats);

module.exports = router;
