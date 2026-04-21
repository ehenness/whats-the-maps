/** Creates shared MySQL connection used by the server-side data layer */
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Emma2005',
  database: 'trivia_app'
});

// Connect once during startup
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }

  console.log('Connected to MySQL database!');
});

module.exports = db;
