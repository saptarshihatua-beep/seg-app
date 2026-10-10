const assert = require('assert');
const { parsePolygonCoordinates, isPointInPolygon, haversineDistanceMeters, getPolygonCentroid } = require('../utils/geoPolygon');
const { generateSecureToken, hashToken, encryptAES, decryptAES } = require('../utils/cryptoUtils');

console.log('--- Starting Automated Test Suite for SEG System ---');

// Test 1: AES-256 Encryption & Decryption
console.log('[Test 1] Testing CryptoJS AES-256 Encryption & Decryption...');
const testSecret = 'Classified Academic Report Content: UCCS CS6910';
const testPassphrase = 'myvoice_secure_key_2026';
const encryptedPayload = encryptAES(testSecret, testPassphrase);
const parsedPayload = JSON.parse(encryptedPayload);

assert(parsedPayload.ct, 'Encrypted payload must contain ciphertext "ct"');
assert(parsedPayload.iv, 'Encrypted payload must contain initialization vector "iv"');
assert(parsedPayload.s, 'Encrypted payload must contain cryptographic salt "s"');

const decryptedText = decryptAES(encryptedPayload, testPassphrase);
assert.strictEqual(decryptedText, testSecret, 'Decrypted text must match original secret exactly');

const wrongDecryption = decryptAES(encryptedPayload, 'wrong_key');
assert(wrongDecryption !== testSecret, 'Decryption with incorrect key must fail or return empty');
console.log('  ✓ AES-256 Encryption, Salt/IV, and Decryption verified.');

// Test 2: Token Generation and SHA-256 Hashing
console.log('[Test 2] Testing Cryptographic Single-Use Token Generation...');
const token1 = generateSecureToken();
const token2 = generateSecureToken();
assert.strictEqual(token1.length, 64, 'Token must be 32 bytes (64 hex characters)');
assert.notStrictEqual(token1, token2, 'Consecutive tokens must be cryptographically random and unique');

const hash1 = hashToken(token1);
const hash2 = hashToken(token1);
assert.strictEqual(hash1, hash2, 'SHA-256 hash must be deterministic for identical input');
assert.strictEqual(hash1.length, 64, 'SHA-256 digest must be 64 hex characters');
console.log('  ✓ Token randomness and SHA-256 hash security verified.');

// Test 3: Ray-Casting Point-in-Polygon (PIP) with UCCS Campus coordinates from PDF
console.log('[Test 3] Testing Point-in-Polygon (Ray-Casting) Algorithm...');
// UCCS Engineering Building coordinates from assignment PDF:
// 38.894143,-104.800769
// 38.893867,-104.801091
// 38.893178,-104.799760
// 38.893445,-104.799589
const rawPdfCoords = "38.894143,-104.800769,38.893867,-104.801091,38.893178,-104.799760,38.893445,-104.799589";
const polygon = parsePolygonCoordinates(rawPdfCoords);

assert.strictEqual(polygon.length, 4, 'Parsed polygon must have 4 vertices');

// Center of UCCS Engineering Building (Inside)
const insidePoint = { lat: 38.893650, lng: -104.800200 };
const isInside = isPointInPolygon(insidePoint, polygon);
assert.strictEqual(isInside, true, 'Point inside campus polygon must evaluate to true');

// Denver downtown point (Outside by ~100 km)
const outsidePoint = { lat: 39.7392, lng: -104.9903 };
const isOutside = isPointInPolygon(outsidePoint, polygon);
assert.strictEqual(isOutside, false, 'Faraway point must evaluate to false');

// Haversine Distance Test
const dist = haversineDistanceMeters(insidePoint, outsidePoint);
assert(dist > 80000 && dist < 120000, `Distance should be ~100km, got ${dist}m`);
console.log('  ✓ Point-in-Polygon containment and Haversine distance verified.');

// Test 4: Centroid Computation
console.log('[Test 4] Testing Centroid Computation...');
const centroid = getPolygonCentroid(polygon);
assert(centroid.lat > 38.89 && centroid.lat < 38.90, 'Centroid latitude should be within bounds');
assert(centroid.lng > -104.81 && centroid.lng < -104.79, 'Centroid longitude should be within bounds');
console.log(`  ✓ Centroid calculated: lat=${centroid.lat}, lng=${centroid.lng}`);

console.log('\n--- All Automated Security & Geometry Tests Passed! (5/5) ---');
