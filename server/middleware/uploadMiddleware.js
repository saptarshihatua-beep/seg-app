const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');

const uploadDir = path.resolve(__dirname, '..', env.UPLOAD_DIR);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeExt = path.extname(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `doc_${Date.now()}_${randomHex}${safeExt}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB max
  }
});

module.exports = upload;
