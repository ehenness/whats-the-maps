const express = require('express');
const router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect('/login');
}

// Home page
router.get('/', (req, res) => {
  res.render('home');
});

// Signup page
router.get('/signup', (req, res) => {
  res.render('signup');
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Dashboard page
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard');
});

// Cities page
router.get('/cities', (req, res) => {
  res.render('cities');
});

module.exports = router;
