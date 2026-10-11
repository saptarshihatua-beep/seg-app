const http = require('http');
const assert = require('assert');
const app = require('../server');
const { decryptAES } = require('../utils/cryptoUtils');
const CryptoJS = require('crypto-js');

function postJson(baseUrl, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsedUrl = new URL(baseUrl + path);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, text: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(baseUrl, path, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(baseUrl + path);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch {
          resolve({ status: res.statusCode, text: responseBody });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Client-side AES decryption helper matching cryptoClient.js
function decryptClientSide(payload, passphrase) {
  const parsedObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
  const salt = CryptoJS.enc.Hex.parse(parsedObj.s);
  const iv = CryptoJS.enc.Hex.parse(parsedObj.iv);
  const ciphertext = CryptoJS.enc.Base64.parse(parsedObj.ct);

  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 1000
  });

  const cipherParams = CryptoJS.lib.CipherParams.create({ ciphertext });
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const base64 = decrypted.toString(CryptoJS.enc.Utf8);
  const rawWords = CryptoJS.enc.Base64.parse(base64);
  return CryptoJS.enc.Utf8.stringify(rawWords);
}

// Client-side AES encryption helper matching cryptoClient.js
function encryptClientSide(text, passphrase) {
  const contentBase64 = CryptoJS.enc.Utf8.parse(text).toString(CryptoJS.enc.Base64);
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 1000
  });
  const encrypted = CryptoJS.AES.encrypt(contentBase64, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return {
    ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(),
    s: salt.toString()
  };
}

async function runComprehensiveTests() {
  console.log('================================================================');
  console.log('   FULL SUITE: DOCUMENT DELIVERY & GEOFENCE SECURITY PIPELINE   ');
  console.log('================================================================\n');

  // Start temporary test server on random open port
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[Setup] In-memory test server listening on ${baseUrl}\n`);

  try {
    // 1. Healthcheck verification
    console.log('[Test 1] Healthcheck endpoint check (/api/health)...');
    const health = await getJson(baseUrl, '/api/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.status, 'online');
    console.log(`  ✓ API health verified. Active DB driver: [${health.data.dbDriver}]`);

    // 2. Sender Authentication
    console.log('\n[Test 2] Sender authentication (alice.sender@uccs.edu)...');
    const senderLogin = await postJson(baseUrl, '/api/auth/login', {
      email: 'alice.sender@uccs.edu',
      password: 'Sender123!'
    });
    assert.strictEqual(senderLogin.status, 200);
    const senderToken = senderLogin.data.token;
    assert(senderToken, 'Sender JWT token must be returned');
    console.log('  ✓ Sender authenticated successfully.');

    // 3. Receiver Authentication (Separate Session)
    console.log('\n[Test 3] Receiver authentication in separate session (bob.receiver@uccs.edu)...');
    const receiverLogin = await postJson(baseUrl, '/api/auth/login', {
      email: 'bob.receiver@uccs.edu',
      password: 'Receiver123!'
    });
    assert.strictEqual(receiverLogin.status, 200);
    const receiverToken = receiverLogin.data.token;
    assert(receiverToken, 'Receiver JWT token must be returned');
    console.log('  ✓ Receiver authenticated successfully.');

    // 4. Sender composes and sends text document to Bob
    console.log('\n[Test 4] Sender creates geolocked text document addressed to bob.receiver@uccs.edu...');
    const secretMessage = 'TOP SECRET RESEARCH: UCCS Autonomous GeoLock Protocol v2.0';
    const aesPassphrase = 'myvoice_secret_pass';
    const encryptedPayload = encryptClientSide(secretMessage, aesPassphrase);

    const composeRes = await postJson(baseUrl, '/api/documents', {
      receiverEmail: 'bob.receiver@uccs.edu',
      locationAddress: 'Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918',
      polygonCoordinates: [
        { lat: 38.894143, lng: -104.800769 },
        { lat: 38.893867, lng: -104.801091 },
        { lat: 38.893178, lng: -104.799760 },
        { lat: 38.893445, lng: -104.799589 }
      ],
      encryptionKey: aesPassphrase,
      clientEncryptedPayload: encryptedPayload,
      originalFilename: 'assignment_4a_memo.txt',
      keyDeliveryMode: 'escrow_geolocked'
    }, senderToken);

    assert.strictEqual(composeRes.status, 201, 'Document creation should return HTTP 201');
    const docId = composeRes.data.document.id;
    const initialToken = composeRes.data.shareInfo.token;
    assert(docId, 'Document ID must be returned');
    assert(initialToken, 'Single-use token must be returned');
    console.log(`  ✓ Document #${docId} created and geolocked in database! Token: ${initialToken.slice(0, 16)}...`);

    // 5. Receiver Inbox Verification
    console.log('\n[Test 5] Receiver Inbox queries documents addressed to bob.receiver@uccs.edu...');
    const inboxRes = await getJson(baseUrl, '/api/documents/receiver', receiverToken);
    assert.strictEqual(inboxRes.status, 200);
    const matchingDocs = inboxRes.data.documents.filter(d => Number(d.id) === Number(docId));
    assert.strictEqual(matchingDocs.length, 1, 'Newly sent document MUST appear in Receiver Inbox');
    const inboxDoc = matchingDocs[0];
    assert.strictEqual(inboxDoc.original_filename, 'assignment_4a_memo.txt');
    assert.strictEqual(inboxDoc.sender_email, 'alice.sender@uccs.edu');
    console.log(`  ✓ Document successfully retrieved in Receiver Inbox! Sender: ${inboxDoc.sender_name}`);

    // 6. Security Boundary: Outside Geofence (Denver) Verification Check
    console.log('\n[Test 6] Security Check: Physical verification attempt from outside geofence (Denver)...');
    const outsideVerif = await postJson(baseUrl, '/api/verify/authorize', {
      token: initialToken,
      latitude: 39.739200,
      longitude: -104.990300,
      accuracy: 10,
      clientTimestamp: Date.now()
    }, receiverToken);

    assert.strictEqual(outsideVerif.status, 403, 'Access outside boundary must be denied (HTTP 403)');
    assert.strictEqual(outsideVerif.data.granted, false);
    assert.strictEqual(outsideVerif.data.reason, 'OUT_OF_BOUNDS');
    console.log(`  ✓ Intrusive access outside boundary denied! Distance: ~${outsideVerif.data.distanceMeters}m`);

    // 7. Legitimate Access: Inside Geofence (UCCS Engineering Building)
    console.log('\n[Test 7] Legitimate Access: Physical verification inside UCCS Engineering Building...');
    const insideVerif = await postJson(baseUrl, '/api/verify/authorize', {
      token: initialToken,
      latitude: 38.893650,
      longitude: -104.800200,
      accuracy: 12,
      clientTimestamp: Date.now()
    }, receiverToken);

    assert.strictEqual(insideVerif.status, 200, 'Access inside boundary must be granted (HTTP 200)');
    assert.strictEqual(insideVerif.data.granted, true);
    assert(insideVerif.data.document.encryptedPayload, 'Encrypted payload must be released to authorized receiver');
    assert.strictEqual(insideVerif.data.document.escrowKey, aesPassphrase, 'Automated escrow key must be released upon physical verification');
    console.log('  ✓ Physical presence certified! Encrypted payload and Escrow Key retrieved.');

    // 8. Decryption Verification
    console.log('\n[Test 8] Client-side AES-256 decryption of retrieved payload...');
    const decryptedText = decryptClientSide(insideVerif.data.document.encryptedPayload, insideVerif.data.document.escrowKey);
    assert.strictEqual(decryptedText, secretMessage, 'Decrypted plaintext must match original message exactly');
    console.log(`  ✓ Decryption successful! Content verified: "${decryptedText.slice(0, 35)}..."`);

    // 9. Single-Use Token Defense (Replay Prevention)
    console.log('\n[Test 9] Replay attack test: Attempting to re-use consumed token...');
    const replayVerif = await postJson(baseUrl, '/api/verify/authorize', {
      token: initialToken,
      latitude: 38.893650,
      longitude: -104.800200,
      accuracy: 12,
      clientTimestamp: Date.now()
    });
    assert.strictEqual(replayVerif.status, 403);
    assert.strictEqual(replayVerif.data.reason, 'TOKEN_ALREADY_USED');
    console.log('  ✓ Token replay attack successfully blocked (TOKEN_ALREADY_USED).');

    // 10. Persistence Check: Receiver Inbox status updated and document preserved
    console.log('\n[Test 10] Persistence Check: Document remains in Receiver Inbox with accessed status...');
    const refreshInbox = await getJson(baseUrl, '/api/documents/receiver', receiverToken);
    assert.strictEqual(refreshInbox.status, 200);
    const accessedDoc = refreshInbox.data.documents.find(d => Number(d.id) === Number(docId));
    assert(accessedDoc, 'Document must persist after access');
    assert.strictEqual(accessedDoc.status, 'accessed');
    console.log('  ✓ Persistence verified: Document remains in inbox with status "accessed".');

    // 11. Unauthorized Access Denial
    console.log('\n[Test 11] Unauthorized user access attempt without token...');
    const unauthorizedAccess = await getJson(baseUrl, `/api/documents/${docId}`);
    assert.strictEqual(unauthorizedAccess.status, 401, 'Unauthenticated request must be rejected');
    console.log('  ✓ Unauthorized access rejected (HTTP 401).');

    console.log('\n================================================================');
    console.log('   ALL 11 END-TO-END DOCUMENT DELIVERY VERIFICATION CHECKS PASSED');
    console.log('================================================================\n');

  } finally {
    server.close();
  }
}

runComprehensiveTests().catch(err => {
  console.error('\n❌ Comprehensive Delivery Test Failed:', err);
  process.exit(1);
});
