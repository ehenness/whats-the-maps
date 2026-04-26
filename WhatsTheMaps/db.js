/**
 * Summary: Creates the shared MySQL connection used by the server-side data layer.
 */
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trivia_app'
});

// Connect once during startup so database issues show up immediately in the logs.
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }

  console.log('Connected to MySQL database!');
});

module.exports = db;
