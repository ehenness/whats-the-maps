const db = require('../repositories/db');

// Wrap the callback-based MySQL client so the rest of the app can use async/await.
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

module.exports = runQuery;