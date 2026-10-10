const crypto = require('crypto');
const CryptoJS = require('crypto-js');

/**
 * Generate cryptographically random single-use access token
 */
function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * SHA-256 hash a token for database storage (never store raw tokens)
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * JSON Formatter for CryptoJS AES matching the assignment PDF standard
 * Formats: {"ct":"...", "iv":"...", "s":"..."}
 */
const JsonFormatter = {
  stringify: function (cipherParams) {
    const jsonObj = {
      ct: cipherParams.ciphertext.toString(CryptoJS.enc.Base64)
    };
    if (cipherParams.iv) {
      jsonObj.iv = cipherParams.iv.toString();
    }
    if (cipherParams.salt) {
      jsonObj.s = cipherParams.salt.toString();
    }
    return JSON.stringify(jsonObj);
  },
  parse: function (jsonStr) {
    const jsonObj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
    const cipherParams = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(jsonObj.ct)
    });
    if (jsonObj.iv) {
      cipherParams.iv = CryptoJS.enc.Hex.parse(jsonObj.iv);
    }
    if (jsonObj.s) {
      cipherParams.salt = CryptoJS.enc.Hex.parse(jsonObj.s);
    }
    return cipherParams;
  }
};

/**
 * Server-side AES-256-CBC Encryption helper with custom passphrase
 */
function encryptAES(plaintext, passphrase) {
  const encrypted = CryptoJS.AES.encrypt(plaintext, passphrase, {
    format: JsonFormatter
  });
  return encrypted.toString();
}

/**
 * Server-side AES-256-CBC Decryption helper
 */
function decryptAES(encryptedPayload, passphrase) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedPayload, passphrase, {
      format: JsonFormatter
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateSecureToken,
  hashToken,
  JsonFormatter,
  encryptAES,
  decryptAES
};
