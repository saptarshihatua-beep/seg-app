const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const tokenController = require('../controllers/tokenController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Create geolocked document (All authenticated users can compose and send)
router.post('/', authenticateToken, upload.single('file'), documentController.createDocument);

// Get sender's uploaded documents (All authenticated users)
router.get('/sender', authenticateToken, documentController.getSenderDocuments);

// Get receiver's documents
router.get('/receiver', authenticateToken, documentController.getReceiverDocuments);

// Generate new access token for document (Sender or Assigned Receiver)
router.post('/:docId/token', authenticateToken, tokenController.generateNewToken);

// Validate token info (Public endpoint for recipient link opening)
router.get('/token/validate', tokenController.validateToken);
router.get('/token/validate/:token', tokenController.validateToken);

// Get document details
router.get('/:id', authenticateToken, documentController.getDocumentDetails);

// Download KML boundary file
router.get('/kml/:filename', documentController.downloadKML);

module.exports = router;
