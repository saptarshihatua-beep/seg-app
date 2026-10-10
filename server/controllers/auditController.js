const db = require('../db/db');

async function getAuditLogs(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let logs = [];
    if (role === 'admin') {
      logs = await db.query(
        `SELECT a.*, u.name as user_name, u.email as user_email, d.original_filename
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN documents d ON a.document_id = d.id
         ORDER BY a.timestamp DESC LIMIT 100`
      );
    } else {
      // Users see logs related to their documents, actions, or received documents
      const userEmail = (req.user.email || '').trim().toLowerCase();
      logs = await db.query(
        `SELECT a.*, u.name as user_name, u.email as user_email, d.original_filename
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         LEFT JOIN documents d ON a.document_id = d.id
         WHERE a.user_id = ? OR d.sender_id = ? OR d.receiver_id = ? OR LOWER(d.receiver_email) = ?
         ORDER BY a.timestamp DESC LIMIT 100`,
        [userId, userId, userId, userEmail]
      );
    }

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

async function getSystemStats(req, res) {
  try {
    const userId = req.user.id;
    const isSender = req.user.role === 'sender' || req.user.role === 'admin';

    let totalDocs = 0;
    let verifiedCount = 0;
    let failedCount = 0;

    if (isSender) {
      const docStat = await db.get("SELECT COUNT(*) as cnt FROM documents WHERE sender_id = ?", [userId]);
      totalDocs = docStat ? docStat.cnt : 0;

      const vStat = await db.get(
        `SELECT 
          SUM(CASE WHEN lv.verification_result = 'GRANTED' THEN 1 ELSE 0 END) as granted_cnt,
          SUM(CASE WHEN lv.verification_result != 'GRANTED' THEN 1 ELSE 0 END) as denied_cnt
         FROM location_verifications lv
         JOIN documents d ON lv.document_id = d.id
         WHERE d.sender_id = ?`,
        [userId]
      );
      verifiedCount = vStat?.granted_cnt || 0;
      failedCount = vStat?.denied_cnt || 0;
    } else {
      const userEmail = (req.user.email || '').trim().toLowerCase();
      const docStat = await db.get("SELECT COUNT(*) as cnt FROM documents WHERE LOWER(receiver_email) = ? OR receiver_id = ?", [userEmail, userId]);
      totalDocs = docStat ? docStat.cnt : 0;

      const vStat = await db.get(
        `SELECT 
          SUM(CASE WHEN lv.verification_result = 'GRANTED' THEN 1 ELSE 0 END) as granted_cnt,
          SUM(CASE WHEN lv.verification_result != 'GRANTED' THEN 1 ELSE 0 END) as denied_cnt
         FROM location_verifications lv
         JOIN documents d ON lv.document_id = d.id
         WHERE d.receiver_id = ? OR LOWER(d.receiver_email) = ?`,
        [userId, userEmail]
      );
      verifiedCount = vStat?.granted_cnt || 0;
      failedCount = vStat?.denied_cnt || 0;
    }

    res.json({
      stats: {
        totalDocs,
        verifiedCount,
        failedCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get stats.' });
  }
}

module.exports = {
  getAuditLogs,
  getSystemStats
};
