const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const tokenController = require('../controllers/tokenController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Create geolocked document (Senders or Admins)
router.post('/', authenticateToken, requireRole(['sender', 'admin']), upload.single('file'), documentController.createDocument);

// Get sender's uploaded documents
router.get('/sender', authenticateToken, requireRole(['sender', 'admin']), documentController.getSenderDocuments);

// Get receiver's documents
router.get('/receiver', authenticateToken, documentController.getReceiverDocuments);

// Generate new access token for document (Sender or Assigned Receiver)
router.post('/:docId/token', authenticateToken, tokenController.generateNewToken);

// Validate token info (Public endpoint for recipient link opening)
router.get('/token/validate', tokenController.validateToken);

// Get document details
router.get('/:id', authenticateToken, documentController.getDocumentDetails);

// Download KML boundary file
router.get('/kml/:filename', documentController.downloadKML);

module.exports = router;
