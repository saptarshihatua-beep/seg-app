/**
 * SEG Mock & Offline Fallback Engine
 * Provides full-featured local simulation for static hosting environments (such as Vercel/Netlify)
 * when a dedicated Express/SQLite backend server is not reachable.
 */

const STORAGE_KEYS = {
  USERS: 'seg_mock_users',
  DOCUMENTS: 'seg_mock_documents',
  TOKENS: 'seg_mock_tokens',
  AUDIT_LOGS: 'seg_mock_audit_logs'
};

const DEFAULT_USERS = [
  { id: 1, name: 'Alice Vance (Sender)', email: 'alice.sender@uccs.edu', password: 'Sender123!', role: 'sender' },
  { id: 2, name: 'Bob Miller (Receiver)', email: 'bob.receiver@uccs.edu', password: 'Receiver123!', role: 'receiver' },
  { id: 3, name: 'Dr. Edward Chow', email: 'edward@chow-s.com', password: 'Edward123!', role: 'sender' },
  { id: 4, name: 'Ashish Korpe', email: 'ashish@uccs.edu', password: 'Ashish123!', role: 'receiver' }
];

const DEFAULT_UCCS_COORDS = [
  { lat: 38.894143, lng: -104.800769 },
  { lat: 38.894164, lng: -104.800104 },
  { lat: 38.893397, lng: -104.800114 },
  { lat: 38.893397, lng: -104.800779 }
];

const DEFAULT_ENCRYPTED_PAYLOAD = {
  ct: "K0h67/QEU2DbTuwD6fz6bZS/+s+ma9RXN6HW4dtlg6F3XSS53MB44yltdkSYdcKANlu4wlP+FVUTcKb8q4GpZZd+t1w56S4uZAfGy7QTvTKeF3GzYFn453VNmitNE3yEGZjLsRPfeFdo3yjN6CVhOKMLtKcjAGDw8v+0Bu3IiSAbfarVxKQ9XHnxwv39/Pn2",
  iv: "9b2d03a684bb0eba434dea44e49fabd0",
  s: "28ba5bdb0c7c9b30dfc9d0f2c61c67db"
};

function initStorage() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }

  if (!localStorage.getItem(STORAGE_KEYS.DOCUMENTS)) {
    const initialDocs = [
      {
        id: 1,
        sender_id: 1,
        sender_name: 'Alice Vance (Sender)',
        sender_email: 'alice.sender@uccs.edu',
        receiver_id: 2,
        receiver_email: 'bob.receiver@uccs.edu',
        original_filename: 'Assignment_4a_Classified_Brief.txt',
        file_size: 1450,
        mime_type: 'text/plain',
        location_address: 'Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918',
        polygon_coordinates: DEFAULT_UCCS_COORDS,
        kml_reference: 'boundary_uccs_engineering.kml',
        status: 'active',
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        encryption_metadata: {
          algorithm: 'AES-256-CBC',
          format: 'CryptoJS-JsonFormatter',
          iv: DEFAULT_ENCRYPTED_PAYLOAD.iv,
          salt: DEFAULT_ENCRYPTED_PAYLOAD.s,
          keyDelivery: 'out_of_band'
        },
        encrypted_payload: JSON.stringify(DEFAULT_ENCRYPTED_PAYLOAD),
        token: 'uccs-demo-token-1'
      },
      {
        id: 2,
        sender_id: 3,
        sender_name: 'Dr. Edward Chow',
        sender_email: 'edward@chow-s.com',
        receiver_id: 2,
        receiver_email: 'bob.receiver@uccs.edu',
        original_filename: 'Project_4a_Executive_Summary.txt',
        file_size: 2180,
        mime_type: 'text/plain',
        location_address: 'Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918',
        polygon_coordinates: DEFAULT_UCCS_COORDS,
        kml_reference: 'boundary_uccs_engineering.kml',
        status: 'active',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        encryption_metadata: {
          algorithm: 'AES-256-CBC',
          format: 'CryptoJS-JsonFormatter',
          iv: DEFAULT_ENCRYPTED_PAYLOAD.iv,
          salt: DEFAULT_ENCRYPTED_PAYLOAD.s,
          keyDelivery: 'escrow_geolocked',
          escrowKey: 'myvoice'
        },
        encrypted_payload: JSON.stringify(DEFAULT_ENCRYPTED_PAYLOAD),
        token: 'uccs-demo-token-2'
      }
    ];
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(initialDocs));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
    const initialTokens = {
      'uccs-demo-token-1': { document_id: 1, expires_at: new Date(Date.now() + 86400000 * 7).toISOString(), used_at: null },
      'uccs-demo-token-2': { document_id: 2, expires_at: new Date(Date.now() + 86400000 * 7).toISOString(), used_at: null }
    };
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(initialTokens));
  }

  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    const initialLogs = [
      {
        id: 1,
        user_name: 'Dr. Edward Chow',
        user_email: 'edward@chow-s.com',
        action: 'SYSTEM_BOOT',
        details: 'SEG v2.0 Client Security Engine Initialized with AES-256-CBC & GIS Point-in-Polygon',
        original_filename: null,
        timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 2,
        user_name: 'Alice Vance (Sender)',
        user_email: 'alice.sender@uccs.edu',
        action: 'DOCUMENT_CREATED',
        details: 'Document "Assignment_4a_Classified_Brief.txt" geolocked to UCCS Engineering Building (4 boundary vertices)',
        original_filename: 'Assignment_4a_Classified_Brief.txt',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
  }
}

// Ray-casting point-in-polygon algorithm matching Ashish Korpe thesis
function isPointInPolygon(point, polygon) {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat ?? polygon[i][0];
    const yi = polygon[i].lng ?? polygon[i][1];
    const xj = polygon[j].lat ?? polygon[j][0];
    const yj = polygon[j].lng ?? polygon[j][1];
    const intersect = ((yi > point.lng) !== (yj > point.lng)) &&
      (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function haversineDistanceMeters(p1, p2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = deg => (deg * Math.PI) / 180;
  const lat1 = toRad(p1.lat ?? p1[0]);
  const lat2 = toRad(p2.lat ?? p2[0]);
  const dLat = toRad((p2.lat ?? p2[0]) - (p1.lat ?? p1[0]));
  const dLng = toRad((p2.lng ?? p2[1]) - (p1.lng ?? p1[1]));

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function logAuditEvent(action, details, originalFilename = null) {
  try {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const user = JSON.parse(localStorage.getItem('seg_user') || '{}');
    const newEntry = {
      id: Date.now(),
      user_name: user.name || 'Anonymous',
      user_email: user.email || 'guest@uccs.edu',
      action,
      details,
      original_filename: originalFilename,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to record mock audit log:', e);
  }
}

export const mockApi = {
  async login(email, password) {
    initStorage();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user || user.password !== password) {
      logAuditEvent('LOGIN_FAILED', `Failed login attempt for ${normalizedEmail}`);
      throw new Error('Invalid email or password credentials.');
    }

    const token = 'mock_jwt_' + btoa(JSON.stringify({ id: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 }));
    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    logAuditEvent('LOGIN_SUCCESS', `User ${safeUser.name} authenticated successfully`);

    return {
      message: 'Login successful (Offline / Demo Engine)',
      token,
      user: safeUser
    };
  },

  async register(name, email, password, role) {
    initStorage();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const normalizedEmail = (email || '').trim().toLowerCase();

    const existingUserIndex = users.findIndex(u => u.email.toLowerCase() === normalizedEmail);
    if (existingUserIndex !== -1) {
      users[existingUserIndex].name = name.trim();
      users[existingUserIndex].password = password;
      if (role) users[existingUserIndex].role = role;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      const userObj = users[existingUserIndex];
      const token = 'mock_jwt_' + btoa(JSON.stringify({ id: userObj.id, email: userObj.email, role: userObj.role }));
      const safeUser = { id: userObj.id, name: userObj.name, email: userObj.email, role: userObj.role };
      return {
        message: 'Account authenticated successfully',
        token,
        user: safeUser
      };
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === 'sender' ? 'sender' : 'receiver'
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const token = 'mock_jwt_' + btoa(JSON.stringify({ id: newUser.id, email: newUser.email, role: newUser.role }));
    const safeUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    logAuditEvent('USER_REGISTERED', `New account registered: ${newUser.name} (${newUser.role})`);

    return {
      message: 'Registration successful',
      token,
      user: safeUser
    };
  },

  async getMe() {
    initStorage();
    const savedUser = localStorage.getItem('seg_user');
    if (!savedUser) throw new Error('Not authenticated');
    return { user: JSON.parse(savedUser) };
  },

  async listReceivers() {
    initStorage();
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const currentUser = JSON.parse(localStorage.getItem('seg_user') || '{}');
    const receivers = users
      .filter(u => u.email !== currentUser.email)
      .map(u => ({ id: u.id, name: u.name, email: u.email }));
    return { receivers };
  },

  async createDocument(formData) {
    initStorage();
    let receiverEmail, locationAddress, polygonCoordinates, originalFilename, clientEncryptedPayload, keyDeliveryMode, authorizedWifiBssid, authorizedBleUuid;

    if (formData instanceof FormData) {
      receiverEmail = formData.get('receiverEmail');
      locationAddress = formData.get('locationAddress');
      polygonCoordinates = JSON.parse(formData.get('polygonCoordinates') || '[]');
      originalFilename = formData.get('originalFilename') || 'document.txt';
      clientEncryptedPayload = formData.get('clientEncryptedPayload');
      keyDeliveryMode = formData.get('keyDeliveryMode') || 'out_of_band';
      authorizedWifiBssid = formData.get('authorizedWifiBssid');
      authorizedBleUuid = formData.get('authorizedBleUuid');
    } else {
      receiverEmail = formData.receiverEmail;
      locationAddress = formData.locationAddress;
      polygonCoordinates = formData.polygonCoordinates || [];
      originalFilename = formData.originalFilename || 'document.txt';
      clientEncryptedPayload = formData.clientEncryptedPayload;
      keyDeliveryMode = formData.keyDeliveryMode || 'out_of_band';
      authorizedWifiBssid = formData.authorizedWifiBssid;
      authorizedBleUuid = formData.authorizedBleUuid;
    }

    const currentUser = JSON.parse(localStorage.getItem('seg_user') || '{"id":1,"name":"Alice Vance"}');
    const docId = Date.now();
    const rawToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);

    const parsedPayload = typeof clientEncryptedPayload === 'string'
      ? JSON.parse(clientEncryptedPayload)
      : (clientEncryptedPayload || DEFAULT_ENCRYPTED_PAYLOAD);

    const newDoc = {
      id: docId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_email: currentUser.email,
      receiver_email: receiverEmail,
      original_filename: originalFilename,
      file_size: JSON.stringify(parsedPayload).length,
      mime_type: 'text/plain',
      location_address: locationAddress,
      polygon_coordinates: polygonCoordinates,
      kml_reference: `boundary_${docId}.kml`,
      status: 'active',
      created_at: new Date().toISOString(),
      encryption_metadata: {
        algorithm: 'AES-256-CBC',
        format: 'CryptoJS-JsonFormatter',
        iv: parsedPayload.iv,
        salt: parsedPayload.s,
        keyDelivery: keyDeliveryMode,
        authWifi: authorizedWifiBssid || null,
        authBle: authorizedBleUuid || null
      },
      encrypted_payload: JSON.stringify(parsedPayload),
      token: rawToken
    };

    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    docs.unshift(newDoc);
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKENS) || '{}');
    tokens[rawToken] = {
      document_id: docId,
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      used_at: null
    };
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));

    logAuditEvent('DOCUMENT_CREATED', `Document "${originalFilename}" geolocked to ${locationAddress}`, originalFilename);

    const shareUrl = `${window.location.origin}/access?token=${rawToken}&docId=${docId}`;

    return {
      message: 'Geolocked document created and encrypted successfully!',
      document: {
        id: docId,
        originalFilename,
        fileSize: newDoc.file_size,
        locationAddress,
        polygonPointsCount: polygonCoordinates.length,
        kmlFilename: newDoc.kml_reference,
        status: 'active'
      },
      shareInfo: {
        token: rawToken,
        expiresAt: tokens[rawToken].expires_at,
        shareUrl
      }
    };
  },

  async getSenderDocuments() {
    initStorage();
    const currentUser = JSON.parse(localStorage.getItem('seg_user') || '{"id":1}');
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    const filtered = docs
      .filter(d => d.sender_id === currentUser.id || d.sender_email?.toLowerCase() === currentUser.email?.toLowerCase())
      .map(d => ({
        ...d,
        successful_verifications: d.status === 'accessed' ? 1 : 0,
        failed_verifications: 0
      }));
    return { documents: filtered };
  },

  async getReceiverDocuments() {
    initStorage();
    const currentUser = JSON.parse(localStorage.getItem('seg_user') || '{"email":"bob.receiver@uccs.edu"}');
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    const filtered = docs
      .filter(d => (d.receiver_email || '').toLowerCase() === (currentUser.email || '').toLowerCase())
      .map(d => ({
        ...d,
        last_verification_result: d.status === 'accessed' ? 'GRANTED' : null
      }));
    return { documents: filtered };
  },

  async generateToken(docId) {
    initStorage();
    const rawToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKENS) || '{}');
    tokens[rawToken] = {
      document_id: Number(docId),
      expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
      used_at: null
    };
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    const shareUrl = `${window.location.origin}/access?token=${rawToken}&docId=${docId}`;

    logAuditEvent('LINK_GENERATED', `New single-use access token generated for Document #${docId}`);

    return {
      message: 'Access link generated successfully',
      token: rawToken,
      expiresAt: tokens[rawToken].expires_at,
      shareUrl
    };
  },

  async getDocumentDetails(docId) {
    initStorage();
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    const doc = docs.find(d => Number(d.id) === Number(docId));
    if (!doc) throw new Error('Document not found');

    return {
      document: {
        id: doc.id,
        originalFilename: doc.original_filename,
        fileSize: doc.file_size,
        mimeType: doc.mime_type,
        locationAddress: doc.location_address,
        polygonCoordinates: doc.polygon_coordinates,
        kmlReference: doc.kml_reference,
        status: doc.status,
        senderName: doc.sender_name,
        senderEmail: doc.sender_email,
        receiverEmail: doc.receiver_email,
        createdAt: doc.created_at,
        authWifi: doc.encryption_metadata?.authWifi,
        authBle: doc.encryption_metadata?.authBle,
        keyDelivery: doc.encryption_metadata?.keyDelivery
      }
    };
  },

  async validateToken(token, docId) {
    initStorage();
    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKENS) || '{}');
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');

    let targetDoc = null;
    let tokenMeta = null;

    if (token && tokens[token]) {
      tokenMeta = tokens[token];
      targetDoc = docs.find(d => Number(d.id) === Number(tokenMeta.document_id));
    } else if (docId) {
      targetDoc = docs.find(d => Number(d.id) === Number(docId));
      tokenMeta = { expires_at: new Date(Date.now() + 86400000).toISOString(), used_at: null };
    }

    if (!targetDoc) {
      // Fallback: match by token embedded in doc
      targetDoc = docs.find(d => d.token === token);
      if (targetDoc) {
        tokenMeta = { expires_at: new Date(Date.now() + 86400000).toISOString(), used_at: null };
      }
    }

    if (!targetDoc) {
      throw new Error('Invalid or expired token.');
    }

    return {
      valid: true,
      document: {
        id: targetDoc.id,
        originalFilename: targetDoc.original_filename,
        fileSize: targetDoc.file_size,
        mimeType: targetDoc.mime_type,
        locationAddress: targetDoc.location_address,
        polygonCoordinates: targetDoc.polygon_coordinates,
        kmlReference: targetDoc.kml_reference,
        senderName: targetDoc.sender_name,
        senderEmail: targetDoc.sender_email,
        receiverEmail: targetDoc.receiver_email,
        authWifi: targetDoc.encryption_metadata?.authWifi,
        authBle: targetDoc.encryption_metadata?.authBle,
        keyDelivery: targetDoc.encryption_metadata?.keyDelivery
      },
      token: tokenMeta
    };
  },

  async requestChallenge(token) {
    return {
      nonce: 'nonce_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      timestamp: Date.now(),
      maxAgeSeconds: 60
    };
  },

  async authorizeLocation(payload) {
    initStorage();
    const { token, latitude, longitude, accuracy, clientTimestamp, wifiBssid, bleBeaconUuid } = payload;
    const tokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOKENS) || '{}');
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');

    let doc = null;
    let tokenKey = null;

    if (token && tokens[token]) {
      tokenKey = token;
      doc = docs.find(d => Number(d.id) === Number(tokens[token].document_id));
    } else {
      doc = docs.find(d => d.token === token);
    }

    if (!doc && docs.length > 0) {
      doc = docs[0]; // Graceful fallback
    }

    if (!doc) throw new Error('Document not found for verification.');

    const userPoint = { lat: Number(latitude), lng: Number(longitude) };
    const inside = isPointInPolygon(userPoint, doc.polygon_coordinates);

    if (!inside) {
      const centroid = doc.polygon_coordinates[0] || { lat: 38.893765, lng: -104.801055 };
      const dist = Math.round(haversineDistanceMeters(userPoint, centroid));
      logAuditEvent('LOCATION_OUT_OF_BOUNDS', `Receiver at (${userPoint.lat}, ${userPoint.lng}) outside geofence boundary (~${dist}m away).`, doc.original_filename);

      throw new Error(`Access Denied: Your current physical location is outside the authorized geofence boundary (~${dist}m away).`);
    }

    // Wi-Fi second factor check (if configured)
    if (doc.encryption_metadata?.authWifi) {
      if (!wifiBssid || wifiBssid.toLowerCase().trim() !== doc.encryption_metadata.authWifi.toLowerCase().trim()) {
        logAuditEvent('WIFI_MISMATCH', `Wi-Fi BSSID mismatch: expected ${doc.encryption_metadata.authWifi}`, doc.original_filename);
        throw new Error(`Second-layer Wi-Fi verification failed. Expected BSSID: ${doc.encryption_metadata.authWifi}`);
      }
    }

    // BLE second factor check (if configured)
    if (doc.encryption_metadata?.authBle) {
      if (!bleBeaconUuid || bleBeaconUuid.toLowerCase().trim() !== doc.encryption_metadata.authBle.toLowerCase().trim()) {
        logAuditEvent('BLE_MISMATCH', `BLE Beacon mismatch: expected ${doc.encryption_metadata.authBle}`, doc.original_filename);
        throw new Error(`Second-layer BLE Beacon verification failed. Expected UUID: ${doc.encryption_metadata.authBle}`);
      }
    }

    // Mark document as accessed
    doc.status = 'accessed';
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    if (tokenKey && tokens[tokenKey]) {
      tokens[tokenKey].used_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
    }

    logAuditEvent('VERIFICATION_SUCCESS_ACCESS_GRANTED', `Physical presence verified at (${userPoint.lat.toFixed(6)}, ${userPoint.lng.toFixed(6)}). Single-use token consumed.`, doc.original_filename);

    return {
      granted: true,
      message: 'Physical presence verified within authorized boundary! Document access granted.',
      document: {
        id: doc.id,
        originalFilename: doc.original_filename,
        mimeType: doc.mime_type,
        fileSize: doc.file_size,
        encryptedPayload: doc.encrypted_payload,
        encryptionMetadata: doc.encryption_metadata,
        escrowKey: doc.encryption_metadata?.escrowKey || null
      }
    };
  },

  async getAuditLogs() {
    initStorage();
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    return { logs };
  },

  async getSystemStats() {
    initStorage();
    const docs = JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCUMENTS) || '[]');
    const totalDocs = docs.length;
    const verifiedCount = docs.filter(d => d.status === 'accessed').length;
    const failedCount = 0;

    return {
      stats: {
        totalDocs,
        verifiedCount,
        failedCount
      }
    };
  },

  kmlDownloadUrl(filename) {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${filename || 'SEG_Boundary'}</name>
    <description>Authorized boundary for SEG data delivery (UCCS CS6910)</description>
    <Placemark>
      <name>Geofenced Boundary</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              -104.800769,38.894143,0
              -104.800104,38.894164,0
              -104.800114,38.893397,0
              -104.800779,38.893397,0
              -104.800769,38.894143,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;
    return 'data:application/vnd.google-earth.kml+xml;charset=utf-8,' + encodeURIComponent(kml);
  }
};
