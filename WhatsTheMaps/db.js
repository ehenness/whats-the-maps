const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Emma2005',
  database: 'trivia_app'
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }

  console.log('Connected to MySQL database!');
});

module.exports = db;
