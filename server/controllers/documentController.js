const path = require('path');
const fs = require('fs');
const db = require('../db/db');
const env = require('../config/env');
const { parsePolygonCoordinates } = require('../utils/geoPolygon');
const { generateKML } = require('../utils/kmlGenerator');
const { generateSecureToken, hashToken, encryptAES } = require('../utils/cryptoUtils');

const kmlDir = env.KML_DIR;
const uploadDir = env.UPLOAD_DIR;
try {
  if (!fs.existsSync(kmlDir)) fs.mkdirSync(kmlDir, { recursive: true });
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.warn('[Directory warning]:', e.message);
}

/**
 * Compose and create a geolocked encrypted document
 */
async function createDocument(req, res) {
  try {
    const senderId = req.user.id;
    const {
      receiverEmail,
      locationAddress,
      polygonCoordinates,
      encryptionKey,
      clientEncryptedPayload, // Optional: if pre-encrypted on client
      authorizedWifiBssid,
      authorizedBleUuid,
      keyDeliveryMode // 'out_of_band' or 'escrow_geolocked'
    } = req.body;

    if (!receiverEmail || !locationAddress || !polygonCoordinates) {
      return res.status(400).json({ error: 'Receiver email, location address, and polygon coordinates are required.' });
    }

    const normalizedReceiverEmail = receiverEmail.trim().toLowerCase();

    const parsedCoords = parsePolygonCoordinates(polygonCoordinates);
    if (!parsedCoords || parsedCoords.length < 3) {
      return res.status(400).json({
        error: 'Invalid geofence boundary. At least 3 boundary points are required to form a closed polygon.'
      });
    }

    let fileRef = '';
    let originalName = 'document.txt';
    let fileSize = 0;
    let mimeType = 'text/plain';
    let encryptionMeta = {};
    let encryptedPayloadStr = '';

    // 1. If file uploaded via Multer
    if (req.file) {
      originalName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype || 'application/octet-stream';
      fileRef = req.file.filename;

      if (!encryptionKey && !clientEncryptedPayload) {
        return res.status(400).json({ error: 'AES encryption key or pre-encrypted payload is required.' });
      }

      if (clientEncryptedPayload) {
        // Client pre-encrypted the file
        encryptionMeta = typeof clientEncryptedPayload === 'string'
          ? JSON.parse(clientEncryptedPayload)
          : clientEncryptedPayload;
        encryptedPayloadStr = typeof clientEncryptedPayload === 'string'
          ? clientEncryptedPayload
          : JSON.stringify(clientEncryptedPayload);

        try {
          fs.writeFileSync(req.file.path, encryptedPayloadStr, 'utf8');
        } catch (e) {}
      } else {
        // Server AES encrypts the uploaded file buffer
        const rawContent = fs.readFileSync(req.file.path).toString('base64');
        encryptedPayloadStr = encryptAES(rawContent, encryptionKey);
        encryptionMeta = JSON.parse(encryptedPayloadStr);

        try {
          fs.writeFileSync(req.file.path, encryptedPayloadStr, 'utf8');
        } catch (e) {}
      }
    } else if (clientEncryptedPayload) {
      // Text or payload submitted directly without multipart file
      originalName = req.body.originalFilename || 'confidential_memo.txt';
      encryptedPayloadStr = typeof clientEncryptedPayload === 'string'
        ? clientEncryptedPayload
        : JSON.stringify(clientEncryptedPayload);
      fileSize = Buffer.byteLength(encryptedPayloadStr, 'utf8');
      mimeType = 'text/plain';
      encryptionMeta = typeof clientEncryptedPayload === 'string'
        ? JSON.parse(clientEncryptedPayload)
        : clientEncryptedPayload;

      const randomFilename = `doc_${Date.now()}_payload.enc`;
      fileRef = randomFilename;
      try {
        const filePath = path.join(uploadDir, randomFilename);
        fs.writeFileSync(filePath, encryptedPayloadStr, 'utf8');
      } catch (e) {}
    } else if (req.body.plainTextContent && encryptionKey) {
      // Plain text submitted for server-side AES encryption
      originalName = req.body.originalFilename || 'secret_note.txt';
      encryptedPayloadStr = encryptAES(req.body.plainTextContent, encryptionKey);
      encryptionMeta = JSON.parse(encryptedPayloadStr);
      fileSize = Buffer.byteLength(req.body.plainTextContent, 'utf8');
      mimeType = 'text/plain';
      const randomFilename = `doc_${Date.now()}_note.enc`;
      fileRef = randomFilename;
      try {
        const filePath = path.join(uploadDir, randomFilename);
        fs.writeFileSync(filePath, encryptedPayloadStr, 'utf8');
      } catch (e) {}
    } else {
      return res.status(400).json({ error: 'Please provide a file to encrypt or text content.' });
    }

    // Attach security extras to metadata (e.g. WiFi BSSID / BLE UUID constraints, key escrow)
    encryptionMeta.authWifi = authorizedWifiBssid || null;
    encryptionMeta.authBle = authorizedBleUuid || null;
    encryptionMeta.keyDelivery = keyDeliveryMode || 'out_of_band';
    if (keyDeliveryMode === 'escrow_geolocked' && encryptionKey) {
      encryptionMeta.escrowKey = Buffer.from(encryptionKey).toString('base64');
    }

    // 2. Generate KML file
    const kmlContent = generateKML({
      documentName: originalName,
      address: locationAddress,
      coordinates: parsedCoords,
      description: `Geolocked Area for Recipient: ${normalizedReceiverEmail}`
    });
    const kmlFilename = `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}.kml`;
    try {
      const kmlPath = path.join(kmlDir, kmlFilename);
      fs.writeFileSync(kmlPath, kmlContent, 'utf8');
    } catch (e) {}

    // 3. Find recipient user if already registered
    const receiverUser = await db.get("SELECT id FROM users WHERE LOWER(email) = ?", [normalizedReceiverEmail]);
    const receiverId = receiverUser ? receiverUser.id : null;

    // 4. Save to Database (including encrypted_payload directly in table for persistent zero-loss storage)
    const docResult = await db.run(
      `INSERT INTO documents (
        sender_id, receiver_id, receiver_email, original_filename, file_size,
        mime_type, encrypted_file_reference, encryption_metadata, encrypted_payload,
        location_address, polygon_coordinates, kml_reference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        senderId,
        receiverId,
        normalizedReceiverEmail,
        originalName,
        fileSize,
        mimeType,
        fileRef,
        JSON.stringify(encryptionMeta),
        encryptedPayloadStr,
        locationAddress,
        JSON.stringify(parsedCoords),
        kmlFilename,
        'active'
      ]
    );

    const docId = docResult.insertId;

    // 5. Generate Initial Access Token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + env.TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await db.run(
      "INSERT INTO access_tokens (document_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [docId, tokenHash, expiresAt.toISOString()]
    );

    // 6. Security Audit Log
    await db.run(
      "INSERT INTO audit_logs (user_id, action, document_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
      [
        senderId,
        'DOCUMENT_CREATED',
        docId,
        `Document "${originalName}" geolocked to ${locationAddress} with ${parsedCoords.length} boundary points for ${normalizedReceiverEmail}.`,
        req.ip || req.connection?.remoteAddress
      ]
    );

    const shareUrl = `${env.CLIENT_URL}/access?token=${rawToken}&docId=${docId}`;

    res.status(201).json({
      message: 'Geolocked document created and encrypted successfully!',
      document: {
        id: docId,
        originalFilename: originalName,
        fileSize,
        locationAddress,
        polygonPointsCount: parsedCoords.length,
        kmlFilename,
        status: 'active'
      },
      shareInfo: {
        token: rawToken,
        expiresAt: expiresAt.toISOString(),
        shareUrl
      }
    });
  } catch (err) {
    console.error('[Create Document Error]:', err);
    res.status(500).json({ error: 'Failed to create and geolock document: ' + err.message });
  }
}

/**
 * List documents created by the sender
 */
async function getSenderDocuments(req, res) {
  try {
    const senderId = req.user.id;
    const docs = await db.query(
      `SELECT d.*, 
        (SELECT COUNT(*) FROM location_verifications lv WHERE lv.document_id = d.id AND lv.verification_result = 'GRANTED') as successful_verifications,
        (SELECT COUNT(*) FROM location_verifications lv WHERE lv.document_id = d.id AND lv.verification_result != 'GRANTED') as failed_verifications
       FROM documents d
       WHERE d.sender_id = ?
       ORDER BY d.created_at DESC`,
      [senderId]
    );

    const formatted = docs.map(d => ({
      ...d,
      successful_verifications: parseInt(d.successful_verifications || 0, 10),
      failed_verifications: parseInt(d.failed_verifications || 0, 10),
      polygon_coordinates: parsePolygonCoordinates(d.polygon_coordinates),
      encryption_metadata: JSON.parse(d.encryption_metadata || '{}')
    }));

    res.json({ documents: formatted });
  } catch (err) {
    console.error('[Get Sender Documents Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve sender documents.' });
  }
}

/**
 * List documents shared with the receiver
 */
async function getReceiverDocuments(req, res) {
  try {
    const userEmail = req.user.email.trim().toLowerCase();
    const userId = req.user.id;

    // Automatically link any documents addressed to this email that don't have receiver_id yet
    try {
      await db.run(
        "UPDATE documents SET receiver_id = ? WHERE receiver_id IS NULL AND LOWER(receiver_email) = ?",
        [userId, userEmail]
      );
    } catch (e) {}

    const docs = await db.query(
      `SELECT d.id, d.original_filename, d.file_size, d.mime_type, d.location_address,
              d.polygon_coordinates, d.kml_reference, d.status, d.created_at,
              COALESCE(u.name, 'Sender') as sender_name,
              COALESCE(u.email, '') as sender_email,
              (SELECT lv.verification_result FROM location_verifications lv 
               WHERE lv.document_id = d.id ORDER BY lv.id DESC LIMIT 1) as last_verification_result
       FROM documents d
       LEFT JOIN users u ON d.sender_id = u.id
       WHERE LOWER(d.receiver_email) = ? OR d.receiver_id = ?
       ORDER BY d.created_at DESC`,
      [userEmail, userId]
    );

    const formatted = docs.map(d => ({
      ...d,
      polygon_coordinates: parsePolygonCoordinates(d.polygon_coordinates)
    }));

    res.json({ documents: formatted });
  } catch (err) {
    console.error('[Get Receiver Documents Error]:', err);
    res.status(500).json({ error: 'Failed to retrieve receiver documents.' });
  }
}

/**
 * Get document details for map inspection / verification preview
 */
async function getDocumentDetails(req, res) {
  try {
    const docId = parseInt(req.params.id, 10);
    if (isNaN(docId)) {
      return res.status(400).json({ error: 'Invalid document ID.' });
    }
    const doc = await db.get(
      `SELECT d.*, COALESCE(u.name, 'Sender') as sender_name, COALESCE(u.email, '') as sender_email
       FROM documents d
       LEFT JOIN users u ON d.sender_id = u.id
       WHERE d.id = ?`,
      [docId]
    );

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Access check: sender, recipient, or admin
    const isSender = req.user && req.user.id === doc.sender_id;
    const isReceiver = req.user && (
      req.user.id === doc.receiver_id ||
      (req.user.email && req.user.email.toLowerCase() === doc.receiver_email.toLowerCase())
    );

    if (req.user && !isSender && !isReceiver && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to view this document.' });
    }

    const meta = JSON.parse(doc.encryption_metadata || '{}');

    res.json({
      document: {
        id: doc.id,
        originalFilename: doc.original_filename,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        locationAddress: doc.location_address,
        polygonCoordinates: parsePolygonCoordinates(doc.polygon_coordinates),
        kmlReference: doc.kml_reference,
        status: doc.status,
        senderName: doc.sender_name,
        senderEmail: doc.sender_email,
        receiverEmail: doc.receiver_email,
        createdAt: doc.created_at,
        authWifi: meta.authWifi,
        authBle: meta.authBle,
        keyDelivery: meta.keyDelivery
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get document details: ' + err.message });
  }
}

/**
 * Download KML file for Google Earth visualization (with on-the-fly fallback)
 */
async function downloadKML(req, res) {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(kmlDir, filename);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return fs.createReadStream(filePath).pipe(res);
    }

    // On-the-fly regeneration from database coordinates
    const doc = await db.get("SELECT * FROM documents WHERE kml_reference = ?", [filename]);
    if (doc) {
      const kmlContent = generateKML({
        documentName: doc.original_filename,
        address: doc.location_address,
        coordinates: parsePolygonCoordinates(doc.polygon_coordinates),
        description: `Geolocked Area for Recipient: ${doc.receiver_email}`
      });
      res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(kmlContent);
    }

    res.status(404).json({ error: 'KML boundary file not found.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to download KML file: ' + err.message });
  }
}

module.exports = {
  createDocument,
  getSenderDocuments,
  getReceiverDocuments,
  getDocumentDetails,
  downloadKML
};
