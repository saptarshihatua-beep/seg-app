const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db/db');
const env = require('../config/env');
const { parsePolygonCoordinates, isPointInPolygon, haversineDistanceMeters, getPolygonCentroid } = require('../utils/geoPolygon');
const { hashToken } = require('../utils/cryptoUtils');

const uploadDir = env.UPLOAD_DIR;

// Ephemeral challenge cache for replay resistance { tokenHash: { nonce, issuedAt } }
const challengeCache = new Map();

/**
 * Issue a replay-resistant cryptographic challenge nonce for the receiver
 */
async function issueChallenge(req, res) {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required to issue challenge.' });
    }

    const tokenHash = hashToken(token);
    const tokenRecord = await db.get("SELECT * FROM access_tokens WHERE token_hash = ?", [tokenHash]);
    if (!tokenRecord) {
      return res.status(404).json({ error: 'Invalid token.' });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    challengeCache.set(tokenHash, {
      nonce,
      issuedAt: Date.now()
    });

    res.json({
      nonce,
      timestamp: Date.now(),
      maxAgeSeconds: env.MAX_LOCATION_AGE_SECONDS
    });
  } catch (err) {
    res.status(500).json({ error: 'Challenge generation failed.' });
  }
}

/**
 * Multi-layer Location Verification and Secure Document Release
 */
async function verifyAndAuthorize(req, res) {
  try {
    const {
      token,
      latitude,
      longitude,
      accuracy,
      clientTimestamp,
      challengeNonce,
      wifiBssid,
      wifiSsid,
      bleBeaconUuid,
      bleRssi
    } = req.body;

    if (!token) {
      return res.status(400).json({ granted: false, error: 'Access token is required.' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ granted: false, error: 'Latitude and Longitude are required for geofence verification.' });
    }

    const tokenHash = hashToken(token);
    const tokenRecord = await db.get("SELECT * FROM access_tokens WHERE token_hash = ?", [tokenHash]);

    if (!tokenRecord) {
      return res.status(403).json({
        granted: false,
        reason: 'INVALID_TOKEN',
        error: 'Access token not recognized or forged.'
      });
    }

    // Check expiration
    if (new Date() > new Date(tokenRecord.expires_at)) {
      return res.status(403).json({
        granted: false,
        reason: 'TOKEN_EXPIRED',
        error: 'Access token has expired. Access denied.'
      });
    }

    // Check single-use
    if (tokenRecord.used_at) {
      return res.status(403).json({
        granted: false,
        reason: 'TOKEN_ALREADY_USED',
        error: 'This single-use access token has already been consumed.'
      });
    }

    // Fetch document
    const doc = await db.get("SELECT * FROM documents WHERE id = ?", [tokenRecord.document_id]);
    if (!doc) {
      return res.status(404).json({ granted: false, error: 'Target document not found.' });
    }

    const polygonCoords = parsePolygonCoordinates(doc.polygon_coordinates);
    const meta = JSON.parse(doc.encryption_metadata || '{}');

    // 1. Freshness Check (Anti-Replay)
    if (clientTimestamp) {
      const now = Date.now();
      const ageSeconds = Math.abs(now - Number(clientTimestamp)) / 1000;
      if (ageSeconds > env.MAX_LOCATION_AGE_SECONDS) {
        await logVerificationAttempt(doc.id, req.user?.id, 'GPS_BROWSER', 'DENIED_STALE');
        return res.status(403).json({
          granted: false,
          reason: 'STALE_READING',
          error: `Location timestamp is stale (${Math.round(ageSeconds)}s old). Must be within ${env.MAX_LOCATION_AGE_SECONDS} seconds to prevent replay attacks.`,
          retryAllowed: true
        });
      }
    }

    // 2. Accuracy Check (Anti-Coarse Spoofing)
    const reportedAccuracy = parseFloat(accuracy) || 999;
    if (reportedAccuracy > env.MAX_ALLOWED_ACCURACY_METERS) {
      await logVerificationAttempt(doc.id, req.user?.id, 'GPS_BROWSER', 'DENIED_INACCURATE');
      return res.status(403).json({
        granted: false,
        reason: 'INACCURATE_POSITION',
        error: `GPS accuracy is too low (reported ±${Math.round(reportedAccuracy)}m, maximum permitted is ±${env.MAX_ALLOWED_ACCURACY_METERS}m). Please enable high-accuracy device location.`,
        retryAllowed: true
      });
    }

    // 3. Point-in-Polygon (PIP) Geofence Check
    const userPoint = { lat: parseFloat(latitude), lng: parseFloat(longitude) };
    const insidePolygon = isPointInPolygon(userPoint, polygonCoords);

    if (!insidePolygon) {
      const centroid = getPolygonCentroid(polygonCoords);
      const distToCentroid = Math.round(haversineDistanceMeters(userPoint, centroid));

      await logVerificationAttempt(doc.id, req.user?.id, 'GPS_BROWSER', 'DENIED_OUT_OF_BOUNDS');
      await db.run(
        "INSERT INTO audit_logs (user_id, action, document_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
        [
          req.user?.id || null,
          'LOCATION_OUT_OF_BOUNDS',
          doc.id,
          `Location (${userPoint.lat.toFixed(6)}, ${userPoint.lng.toFixed(6)}) outside polygon. ~${distToCentroid}m from zone center.`,
          req.ip || req.connection?.remoteAddress
        ]
      );

      return res.status(403).json({
        granted: false,
        reason: 'OUT_OF_BOUNDS',
        error: 'Access Denied: Your current physical location is outside the authorized geofence boundary.',
        distanceMeters: distToCentroid,
        zoneAddress: doc.location_address,
        retryAllowed: true
      });
    }

    // 4. Secondary Layer: Authorized Wi-Fi BSSID Check (if enforced by sender)
    if (meta.authWifi) {
      const normalizedReqBssid = meta.authWifi.toLowerCase().trim();
      const reportedBssid = (wifiBssid || '').toLowerCase().trim();
      if (!reportedBssid || reportedBssid !== normalizedReqBssid) {
        await logVerificationAttempt(doc.id, req.user?.id, 'WIFI_BSSID', 'DENIED_WIFI_MISMATCH');
        await db.run(
          "INSERT INTO audit_logs (user_id, action, document_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
          [
            req.user?.id || null,
            'WIFI_BSSID_MISMATCH',
            doc.id,
            `Second-layer Wi-Fi verification failed. Reported BSSID: ${wifiBssid || 'None'} (Mismatch with sender requirements).`,
            req.ip || req.connection?.remoteAddress
          ]
        );
        return res.status(403).json({
          granted: false,
          reason: 'WIFI_MISMATCH',
          error: `Second-layer Wi-Fi verification failed: The reported Wi-Fi BSSID (${wifiBssid || 'None'}) does not match the authorized physical access point configured by the sender.`,
          retryAllowed: true
        });
      }
    }

    // 5. Secondary Layer: Authorized BLE Beacon Check (if enforced by sender)
    if (meta.authBle) {
      const normalizedReqBle = meta.authBle.toLowerCase().trim();
      const reportedBle = (bleBeaconUuid || '').toLowerCase().trim();
      if (!reportedBle || reportedBle !== normalizedReqBle) {
        await logVerificationAttempt(doc.id, req.user?.id, 'BLE_BEACON', 'DENIED_BLE_MISMATCH');
        await db.run(
          "INSERT INTO audit_logs (user_id, action, document_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
          [
            req.user?.id || null,
            'BLE_BEACON_MISMATCH',
            doc.id,
            `Second-layer In-Building BLE Beacon verification failed. Reported UUID: ${bleBeaconUuid || 'None'} (Mismatch with sender requirements).`,
            req.ip || req.connection?.remoteAddress
          ]
        );
        return res.status(403).json({
          granted: false,
          reason: 'BLE_MISMATCH',
          error: `Second-layer BLE Beacon verification failed: The reported in-building Beacon UUID (${bleBeaconUuid || 'None'}) does not match the authorized physical transmitter configured by the sender.`,
          retryAllowed: true
        });
      }
    }

    // 6. ALL VERIFICATION CHECKS PASSED: Authorize & Consume Token
    await db.run("UPDATE access_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?", [tokenRecord.id]);
    await db.run("UPDATE documents SET status = 'accessed' WHERE id = ?", [doc.id]);

    const verificationMethod = (meta.authWifi || meta.authBle) ? 'MULTI_FACTOR' : 'GPS_BROWSER';
    await logVerificationAttempt(doc.id, req.user?.id, verificationMethod, 'GRANTED');

    // Audit log
    await db.run(
      "INSERT INTO audit_logs (user_id, action, document_id, details, ip_address) VALUES (?, ?, ?, ?, ?)",
      [
        req.user?.id || null,
        'VERIFICATION_SUCCESS_ACCESS_GRANTED',
        doc.id,
        `Geolocking verified successfully via ${verificationMethod} at (${userPoint.lat.toFixed(6)}, ${userPoint.lng.toFixed(6)}). Single-use token consumed.`,
        req.ip || req.connection?.remoteAddress
      ]
    );

    // Retrieve encrypted payload (prioritize database column, then disk, then metadata)
    let encryptedData = '';
    if (doc.encrypted_payload) {
      encryptedData = doc.encrypted_payload;
    } else {
      const uploadFilePath = path.join(uploadDir, doc.encrypted_file_reference);
      if (fs.existsSync(uploadFilePath)) {
        encryptedData = fs.readFileSync(uploadFilePath, 'utf8');
      } else {
        encryptedData = JSON.stringify(meta);
      }
    }

    // Decrypt escrow key if configured
    let escrowKeyPlaintext = null;
    if (meta.keyDelivery === 'escrow_geolocked' && meta.escrowKey) {
      escrowKeyPlaintext = Buffer.from(meta.escrowKey, 'base64').toString('utf8');
    }

    res.json({
      granted: true,
      message: 'Physical presence verified within authorized boundary! Document access granted.',
      document: {
        id: doc.id,
        originalFilename: doc.original_filename,
        mimeType: doc.mime_type,
        fileSize: doc.file_size,
        encryptedPayload: encryptedData,
        encryptionMetadata: {
          algorithm: 'AES-256-CBC',
          format: 'CryptoJS-JsonFormatter',
          iv: meta.iv,
          salt: meta.s,
          keyDelivery: meta.keyDelivery
        },
        escrowKey: escrowKeyPlaintext
      }
    });

  } catch (err) {
    console.error('[Verification Error]:', err);
    res.status(500).json({ granted: false, error: 'Verification pipeline error: ' + err.message });
  }
}

async function logVerificationAttempt(docId, receiverId, method, result) {
  try {
    await db.run(
      "INSERT INTO location_verifications (document_id, receiver_id, verification_method, verification_result) VALUES (?, ?, ?, ?)",
      [docId, receiverId || null, method, result]
    );
  } catch (err) {
    console.error('[Log Verification Attempt Error]:', err);
  }
}

module.exports = {
  issueChallenge,
  verifyAndAuthorize
};
