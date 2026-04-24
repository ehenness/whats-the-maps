const db = require('./db');

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
        resolve(results);
    });
  });
}

function getUserByUsername(username) {
  const sql = 'SELECT * FROM users WHERE username = ? AND is_deleted = FALSE';
  return runQuery(sql, [username]).then(results => results[0]);
}
function getUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE';
  return runQuery(sql, [email]).then(results => results[0]);
}
function getUserById(userId) {
  const sql = 'SELECT * FROM users WHERE id = ?';
  return runQuery(sql, [userId]).then(results => results[0]);
}

function createUser(username, email, passwordHash) {
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  return runQuery(sql, [username, email, passwordHash])
    .then(result => result.insertId);
}
function deleteUser(userId) {
  const sql = 'UPDATE users SET is_deleted = TRUE WHERE id = ?';
  return runQuery(sql, [userId]);
}

module.exports = { getUserByUsername, getUserByEmail, getUserById, createUser, deleteUser };