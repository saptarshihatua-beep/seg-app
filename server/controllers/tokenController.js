const db = require('../db/db');
const env = require('../config/env');
const { generateSecureToken, hashToken } = require('../utils/cryptoUtils');
const { parsePolygonCoordinates } = require('../utils/geoPolygon');

/**
 * Generate a new single-use access token for a document (Sender only)
 */
async function generateNewToken(req, res) {
  try {
    const docId = parseInt(req.params.docId, 10);
    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }
    const userId = parseInt(req.user.id, 10);
    const userEmail = (req.user.email || '').trim().toLowerCase();

    const doc = await db.get(
      "SELECT * FROM documents WHERE id = ? AND (sender_id = ? OR receiver_id = ? OR LOWER(receiver_email) = ?)",
      [docId, userId, userId, userEmail]
    );
    if (!doc && req.user.role !== 'admin') {
      return res.status(404).json({ error: 'Document not found or unauthorized.' });
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.run(
      "INSERT INTO access_tokens (document_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [docId, tokenHash, expiresAt.toISOString()]
    );

    // Audit log
    await db.run(
      "INSERT INTO audit_logs (user_id, action, document_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
      [userId, 'LINK_GENERATED', docId, 'New single-use access token generated', req.ip || req.connection?.remoteAddress]
    );

    const shareUrl = `${env.CLIENT_URL}/access?token=${rawToken}&docId=${docId}`;

    res.json({
      message: 'Access link generated successfully',
      token: rawToken,
      expiresAt: expiresAt.toISOString(),
      shareUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate token: ' + err.message });
  }
}

/**
 * Validate token and return document boundary details for the receiver to verify
 */
async function validateToken(req, res) {
  try {
    const token = req.query.token || req.params.token;
    const docId = req.query.docId || req.params.docId;

    if (!token) {
      return res.status(400).json({ error: 'Access token is required.' });
    }

    const tokenHash = hashToken(token);
    const tokenRecord = await db.get(
      "SELECT * FROM access_tokens WHERE token_hash = ?",
      [tokenHash]
    );

    if (!tokenRecord) {
      return res.status(404).json({
        valid: false,
        error: 'Invalid or forged access token. Access denied.'
      });
    }

    // Check expiration
    const now = new Date();
    const expiry = new Date(tokenRecord.expires_at);
    if (now > expiry) {
      return res.status(410).json({
        valid: false,
        error: 'Access token has expired. Please request a new link from the sender.'
      });
    }

    // Check if already used
    if (tokenRecord.used_at) {
      return res.status(409).json({
        valid: false,
        error: 'Single-use access token has already been consumed. Re-access denied.'
      });
    }

    // Retrieve document details
    const doc = await db.get(
      `SELECT d.id, d.original_filename, d.file_size, d.mime_type, d.location_address,
              d.polygon_coordinates, d.receiver_email, d.kml_reference, d.status,
              COALESCE(u.name, 'Sender') as sender_name,
              COALESCE(u.email, '') as sender_email,
              d.encryption_metadata
       FROM documents d
       LEFT JOIN users u ON d.sender_id = u.id
       WHERE d.id = ?`,
      [tokenRecord.document_id]
    );

    if (!doc) {
      return res.status(404).json({ valid: false, error: 'Referenced document not found.' });
    }

    const meta = JSON.parse(doc.encryption_metadata || '{}');

    res.json({
      valid: true,
      document: {
        id: doc.id,
        originalFilename: doc.original_filename,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        locationAddress: doc.location_address,
        polygonCoordinates: parsePolygonCoordinates(doc.polygon_coordinates),
        kmlReference: doc.kml_reference,
        senderName: doc.sender_name,
        senderEmail: doc.sender_email,
        receiverEmail: doc.receiver_email,
        authWifi: meta.authWifi,
        authBle: meta.authBle,
        requiresWifi: Boolean(meta.authWifi),
        requiresBle: Boolean(meta.authBle),
        keyDelivery: meta.keyDelivery
      },
      token: {
        expiresAt: tokenRecord.expires_at,
        usedAt: tokenRecord.used_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Token validation error: ' + err.message });
  }
}

module.exports = {
  generateNewToken,
  validateToken
};
