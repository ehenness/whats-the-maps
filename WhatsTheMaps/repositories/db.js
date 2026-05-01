/** Creates shared MySQL connection used by server-side data layer */
const mysql = require('mysql2');

function createTestConnection() {
  return {
    connect(callback) {
      if (typeof callback === 'function') {
        callback(null);
      }
    },
    end(callback) {
      if (typeof callback === 'function') {
        callback(null);
      }
    },
    query(sql, params, callback) {
      const handler = typeof params === 'function' ? params : callback;

      if (typeof handler === 'function') {
        handler(new Error('Database access is disabled during tests.'));
      }
    }
  };
}

const db =
  process.env.NODE_ENV === 'test'
    ? createTestConnection()
    : mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'trivia_app'
      });

if (process.env.NODE_ENV !== 'test') {
  db.connect((err) => {
    if (err) {
      console.error('Database connection failed:', err);
      return;
    }
    console.log('Connected to MySQL database!');
  });
}
module.exports = db;
