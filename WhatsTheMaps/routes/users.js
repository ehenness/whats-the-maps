const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Test route
router.get('/', (req, res) => {
  res.send('Users route working');
});

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.status(401).send('You must be logged in to delete your account.');
}

// Signup route
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

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = 'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE';

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

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }

    return res.redirect('/');
  });
});

// Delete account route
router.post('/delete-account', isAuthenticated, (req, res) => {
  const userId = req.session.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).send('Password is required to delete your account.');
  }

  const selectUserSql = 'SELECT id, password, is_deleted FROM users WHERE id = ?';

  db.query(selectUserSql, [userId], async (selectErr, results) => {
    if (selectErr) {
      console.error(selectErr);
      return res.status(500).send('Error looking up your account.');
    }

    if (results.length === 0 || results[0].is_deleted) {
      return res.status(404).send('Account not found.');
    }

    try {
      const passwordMatches = await bcrypt.compare(password, results[0].password);

      if (!passwordMatches) {
        return res.status(400).send('Incorrect password. Account not deleted.');
      }

      const deleteUserSql = `
        UPDATE users
        SET is_deleted = TRUE
        WHERE id = ?
      `;

      db.query(deleteUserSql, [userId], (deleteErr) => {
        if (deleteErr) {
          console.error(deleteErr);
          return res.status(500).send('Error deleting account.');
        }

        req.session.destroy((sessionErr) => {
          if (sessionErr) {
            console.error(sessionErr);
            return res.status(500).send('Account deleted, but there was an error logging you out.');
          }

          return res.redirect('/');
        });
      });
    } catch (compareErr) {
      console.error(compareErr);
      return res.status(500).send('Error verifying your password.');
    }
  });
});

module.exports = router;
