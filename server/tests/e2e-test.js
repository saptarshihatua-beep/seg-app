const http = require('http');

async function postJson(url, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsedUrl = new URL(url);
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

async function runE2E() {
  console.log('--- RUNNING FULL END-TO-END SEG PIPELINE TEST ---');
  
  // 1. Authenticate Sender Alice
  console.log('[Step 1] Logging in as Sender (alice.sender@uccs.edu)...');
  const loginRes = await postJson('http://localhost:5000/api/auth/login', {
    email: 'alice.sender@uccs.edu',
    password: 'Sender123!'
  });
  const senderJwt = loginRes.data.token;
  console.log('  ✓ Sender authenticated. JWT obtained.');

  // 2. Create Geolocked Document
  console.log('[Step 2] Creating and geolocking confidential document...');
  const createRes = await postJson('http://localhost:5000/api/documents', {
    receiverEmail: 'bob.receiver@uccs.edu',
    locationAddress: 'Engineering Building, 1420 Austin Bluffs Parkway, Colorado Springs, CO 80918',
    polygonCoordinates: [
      { lat: 38.894143, lng: -104.800769 },
      { lat: 38.893867, lng: -104.801091 },
      { lat: 38.893178, lng: -104.799760 },
      { lat: 38.893445, lng: -104.799589 }
    ],
    encryptionKey: 'myvoice',
    plainTextContent: 'CONFIDENTIAL: UCCS CS6910 Master Research Data. Physical presence in Engineering Wing strictly required.',
    keyDeliveryMode: 'escrow_geolocked'
  }, senderJwt);

  const docId = createRes.data.document.id;
  const rawToken = createRes.data.shareInfo.token;
  console.log(`  ✓ Document #${docId} created. Single-use token: ${rawToken.substring(0, 16)}...`);

  // 3. Test Negative Case: Access from Denver (Outside Boundary)
  console.log('[Step 3] Testing Negative Access: Receiver in Denver (lat: 39.7392, lng: -104.9903)...');
  const outsideRes = await postJson('http://localhost:5000/api/verify/authorize', {
    token: rawToken,
    latitude: 39.739200,
    longitude: -104.990300,
    accuracy: 10,
    clientTimestamp: Date.now()
  });
  console.log(`  ✓ Outside Boundary Response: HTTP ${outsideRes.status}, reason: ${outsideRes.data.reason}`);
  if (outsideRes.status === 403 && outsideRes.data.reason === 'OUT_OF_BOUNDS') {
    console.log(`  ✓ Correctly rejected with estimated distance ~${outsideRes.data.distanceMeters}m from zone!`);
  } else {
    throw new Error('Expected OUT_OF_BOUNDS rejection but received: ' + JSON.stringify(outsideRes));
  }

  // 4. Test Positive Case: Access from Inside UCCS Campus Polygon
  console.log('[Step 4] Testing Positive Access: Receiver inside UCCS Engineering Building (lat: 38.893650, lng: -104.800200)...');
  const insideRes = await postJson('http://localhost:5000/api/verify/authorize', {
    token: rawToken,
    latitude: 38.893650,
    longitude: -104.800200,
    accuracy: 15,
    clientTimestamp: Date.now()
  });
  console.log(`  ✓ Inside Boundary Response: HTTP ${insideRes.status}, granted: ${insideRes.data.granted}`);
  if (insideRes.status === 200 && insideRes.data.granted) {
    console.log(`  ✓ Successfully authorized! Payload retrieved, Escrow Key: "${insideRes.data.document.escrowKey}"`);
  } else {
    throw new Error('Expected GRANTED authorization but received: ' + JSON.stringify(insideRes));
  }

  // 5. Test Replay / Reuse Attack: Try to use the same token a second time
  console.log('[Step 5] Testing Replay Defense: Attempting to re-use consumed single-use token...');
  const reuseRes = await postJson('http://localhost:5000/api/verify/authorize', {
    token: rawToken,
    latitude: 38.893650,
    longitude: -104.800200,
    accuracy: 15,
    clientTimestamp: Date.now()
  });
  console.log(`  ✓ Replay Attempt Response: HTTP ${reuseRes.status}, reason: ${reuseRes.data.reason}`);
  if (reuseRes.status === 403 && reuseRes.data.reason === 'TOKEN_ALREADY_USED') {
    console.log('  ✓ Token replay attack successfully blocked!');
  } else {
    throw new Error('Expected TOKEN_ALREADY_USED rejection but received: ' + JSON.stringify(reuseRes));
  }

  console.log('\n--- ALL END-TO-END PIPELINE CHECKS PASSED (5/5) ---');
}

runE2E().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
