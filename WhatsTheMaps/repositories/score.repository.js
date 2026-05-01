const db = require('./db');
const runQuery = require('../lib/runQuery');

function getUserStats(userId) {
  const sql = `
    SELECT
      COUNT(*) AS quizzesPlayed,
      COALESCE(SUM(score), 0) AS totalPoints,
      COALESCE(MAX(score), 0) AS bestScore,
      COALESCE(AVG(score), 0) AS averageScore
    FROM scores
    WHERE user_id = ?
  `;

  return runQuery(sql, [userId]).then(res => res[0] || {});
}

function getScoreHistory() {
  const sql = `
    SELECT
      s.user_id AS userId,
      s.score AS score
    FROM users u
    JOIN scores s ON u.id = s.user_id
    WHERE u.is_deleted = FALSE
    ORDER BY s.played_at ASC, s.id ASC
  `;

  return runQuery(sql);
}

function saveScore(userId, score) {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO scores (user_id, score) VALUES (?, ?)',
      [userId, score],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}

module.exports = { saveScore, getUserStats, getScoreHistory };