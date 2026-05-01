const db = require('../repositories/db');

// Wrap callback-based MySQL client app can use async/await.
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
