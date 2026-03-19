const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');


// TEST ROUTE
router.get('/', (req, res) => {
  res.send('Users route working');
});


// SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert into DB
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

    db.query(sql, [username, email, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);

        // Handle duplicates
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Username or email already exists' });
        }

        return res.status(500).json({ error: 'Database error' });
      }

      res.redirect('/login');
    });

  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});


// LOGIN ROUTE
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ?';

  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }

    // User not found
    if (results.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = results[0];

    try {
      // Compare password
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(400).send('Incorrect password');
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email
      };

      res.redirect('/');

    } catch (error) {
      res.status(500).send('Server error');
    }
  });
});


// LOGOUT ROUTE
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }

    res.redirect('/'); // go back to home
  });
});

module.exports = router;