const path = require('path');
const fs = require('fs');
const db = require('../db/db');
const env = require('../config/env');
const { parsePolygonCoordinates } = require('../utils/geoPolygon');
const { generateKML } = require('../utils/kmlGenerator');
const { generateSecureToken, hashToken, encryptAES } = require('../utils/cryptoUtils');

const kmlDir = path.resolve(__dirname, '..', env.KML_DIR);
if (!fs.existsSync(kmlDir)) {
  fs.mkdirSync(kmlDir, { recursive: true });
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
      clientEncryptedPayload, // Optional: if encrypted on client
      authorizedWifiBssid,
      authorizedBleUuid,
      keyDeliveryMode // 'out_of_band' or 'escrow_geolocked'
    } = req.body;

    if (!receiverEmail || !locationAddress || !polygonCoordinates) {
      return res.status(400).json({ error: 'Receiver email, location address, and polygon coordinates are required.' });
    }

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

    // 1. If file uploaded via Multer
    if (req.file) {
      originalName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
      fileRef = req.file.filename;

      if (!encryptionKey && !clientEncryptedPayload) {
        return res.status(400).json({ error: 'AES encryption key or pre-encrypted payload is required.' });
      }

      if (clientEncryptedPayload) {
        // Client pre-encrypted the file
        encryptionMeta = typeof clientEncryptedPayload === 'string'
          ? JSON.parse(clientEncryptedPayload)
          : clientEncryptedPayload;
        // Overwrite file on disk with encrypted payload
        fs.writeFileSync(req.file.path, JSON.stringify(encryptionMeta), 'utf8');
      } else {
        // Server AES encrypts the uploaded file buffer
        const rawContent = fs.readFileSync(req.file.path).toString('base64');
        const encryptedStr = encryptAES(rawContent, encryptionKey);
        encryptionMeta = JSON.parse(encryptedStr);
        // Overwrite file on disk with encrypted payload
        fs.writeFileSync(req.file.path, encryptedStr, 'utf8');
      }
    } else if (clientEncryptedPayload) {
      // Text or payload submitted directly without multipart file
      originalName = req.body.originalFilename || 'geolocked_message.txt';
      fileSize = clientEncryptedPayload.length;
      mimeType = 'application/json';
      encryptionMeta = typeof clientEncryptedPayload === 'string'
        ? JSON.parse(clientEncryptedPayload)
        : clientEncryptedPayload;

      const randomFilename = `doc_${Date.now()}_payload.enc`;
      const filePath = path.join(__dirname, '..', env.UPLOAD_DIR, randomFilename);
      fs.writeFileSync(filePath, JSON.stringify(encryptionMeta), 'utf8');
      fileRef = randomFilename;
    } else if (req.body.plainTextContent && encryptionKey) {
      // Plain text submitted for AES encryption
      originalName = 'secret_note.txt';
      const encryptedStr = encryptAES(req.body.plainTextContent, encryptionKey);
      encryptionMeta = JSON.parse(encryptedStr);
      fileSize = Buffer.byteLength(req.body.plainTextContent, 'utf8');
      const randomFilename = `doc_${Date.now()}_note.enc`;
      const filePath = path.join(__dirname, '..', env.UPLOAD_DIR, randomFilename);
      fs.writeFileSync(filePath, encryptedStr, 'utf8');
      fileRef = randomFilename;
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
      description: `Geolocked Area for Recipient: ${receiverEmail}`
    });
    const kmlFilename = `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}.kml`;
    const kmlPath = path.join(kmlDir, kmlFilename);
    fs.writeFileSync(kmlPath, kmlContent, 'utf8');

    // 3. Find recipient user if already registered
    const receiverUser = await db.get("SELECT id FROM users WHERE email = ?", [receiverEmail.trim().toLowerCase()]);
    const receiverId = receiverUser ? receiverUser.id : null;

    // 4. Save to Database
    const docResult = await db.run(
      `INSERT INTO documents (
        sender_id, receiver_id, receiver_email, original_filename, file_size,
        mime_type, encrypted_file_reference, encryption_metadata,
        location_address, polygon_coordinates, kml_reference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        senderId,
        receiverId,
        receiverEmail.trim().toLowerCase(),
        originalName,
        fileSize,
        mimeType,
        fileRef,
        JSON.stringify(encryptionMeta),
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
        `Document "${originalName}" geolocked to ${locationAddress} with ${parsedCoords.length} boundary points.`,
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

    // Parse coordinates and metadata safely
    const formatted = docs.map(d => ({
      ...d,
      polygon_coordinates: parsePolygonCoordinates(d.polygon_coordinates),
      encryption_metadata: JSON.parse(d.encryption_metadata || '{}')
    }));

    res.json({ documents: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sender documents.' });
  }
}

/**
 * List documents shared with the receiver
 */
async function getReceiverDocuments(req, res) {
  try {
    const userEmail = req.user.email.toLowerCase();
    const docs = await db.query(
      `SELECT d.id, d.original_filename, d.file_size, d.mime_type, d.location_address,
              d.polygon_coordinates, d.kml_reference, d.status, d.created_at,
              u.name as sender_name, u.email as sender_email,
              (SELECT lv.verification_result FROM location_verifications lv 
               WHERE lv.document_id = d.id ORDER BY lv.id DESC LIMIT 1) as last_verification_result
       FROM documents d
       JOIN users u ON d.sender_id = u.id
       WHERE LOWER(d.receiver_email) = ? OR d.receiver_id = ?
       ORDER BY d.created_at DESC`,
      [userEmail, req.user.id]
    );

    const formatted = docs.map(d => ({
      ...d,
      polygon_coordinates: parsePolygonCoordinates(d.polygon_coordinates)
    }));

    res.json({ documents: formatted });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve receiver documents.' });
  }
}

/**
 * Get document details for map inspection / verification preview
 */
async function getDocumentDetails(req, res) {
  try {
    const docId = req.params.id;
    const doc = await db.get(
      `SELECT d.*, u.name as sender_name, u.email as sender_email
       FROM documents d
       JOIN users u ON d.sender_id = u.id
       WHERE d.id = ?`,
      [docId]
    );

    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Access check: must be sender, receiver, or access token bearer
    const isSender = req.user && req.user.id === doc.sender_id;
    const isReceiver = req.user && (req.user.id === doc.receiver_id || req.user.email.toLowerCase() === doc.receiver_email.toLowerCase());

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
    res.status(500).json({ error: 'Failed to get document details.' });
  }
}

/**
 * Download KML file for Google Earth visualization
 */
async function downloadKML(req, res) {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(kmlDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'KML boundary file not found.' });
    }

    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to download KML file.' });
  }
}

module.exports = {
  createDocument,
  getSenderDocuments,
  getReceiverDocuments,
  getDocumentDetails,
  downloadKML
};
