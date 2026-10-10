import CryptoJS from 'crypto-js';

/**
 * JsonFormatter implementation matching Ashish Korpe's SEG prototype (geoloc.js lines 65-93)
 * Serializes/deserializes CryptoJS CipherParams to/from standard JSON:
 * { "ct": "<ciphertext-base64>", "iv": "<iv-hex>", "s": "<salt-hex>" }
 */
export const JsonFormatter = {
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
 * Encrypt arbitrary file buffer (ArrayBuffer) or text using AES-256-CBC
 */
export async function encryptDocumentClientSide(fileOrText, passphrase) {
  let contentBase64 = '';

  if (fileOrText instanceof File || fileOrText instanceof Blob) {
    const arrayBuffer = await fileOrText.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.byteLength; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength));
      binary += String.fromCharCode.apply(null, chunk);
    }
    contentBase64 = btoa(binary);
  } else {
    // Text content
    contentBase64 = CryptoJS.enc.Utf8.parse(fileOrText).toString(CryptoJS.enc.Base64);
  }

  // Generate 128-bit random salt and IV
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);

  // Derive 256-bit key using PBKDF2
  const key = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: 256 / 32,
    iterations: 1000
  });

  const encrypted = CryptoJS.AES.encrypt(contentBase64, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  const payload = {
    ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(),
    s: salt.toString()
  };

  return payload;
}

/**
 * Decrypt payload using passphrase and return decoded string or Blob
 */
export function decryptDocumentClientSide(payload, passphrase) {
  try {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    let parsedObj = null;
    try {
      parsedObj = typeof payload === 'string' ? JSON.parse(payload) : payload;
    } catch {}

    let decryptedBase64 = '';

    // Method 1: PBKDF2 (1000 iterations)
    if (parsedObj && parsedObj.s && parsedObj.iv && parsedObj.ct) {
      try {
        const salt = CryptoJS.enc.Hex.parse(parsedObj.s);
        const iv = CryptoJS.enc.Hex.parse(parsedObj.iv);
        const ciphertext = CryptoJS.enc.Base64.parse(parsedObj.ct);

        const key = CryptoJS.PBKDF2(passphrase, salt, {
          keySize: 256 / 32,
          iterations: 1000
        });

        const cipherParams = CryptoJS.lib.CipherParams.create({
          ciphertext: ciphertext
        });

        const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        });

        decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (e) {}
    }

    // Method 2: Standard CryptoJS JsonFormatter Fallback
    if (!decryptedBase64) {
      try {
        const decrypted = CryptoJS.AES.decrypt(payloadStr, passphrase, { format: JsonFormatter });
        decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);
      } catch (e) {}
    }

    if (!decryptedBase64) {
      return { success: false, error: 'Invalid key or corrupted ciphertext.' };
    }

    // Determine if decrypted payload is plain text or binary (e.g. image)
    let contentString = null;
    let isBinary = false;

    try {
      const parsedWordArray = CryptoJS.enc.Base64.parse(decryptedBase64);
      const utf8Candidate = CryptoJS.enc.Utf8.stringify(parsedWordArray);
      if (utf8Candidate && !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(utf8Candidate.slice(0, 500))) {
        contentString = utf8Candidate;
      } else {
        isBinary = true;
      }
    } catch {
      isBinary = true;
    }

    return {
      success: true,
      content: contentString,
      base64: decryptedBase64,
      isBinary
    };

  } catch (err) {
    return { success: false, error: err.message };
  }
}
