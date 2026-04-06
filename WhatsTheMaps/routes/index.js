var express = require('express');
var router = express.Router();

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // user logged in
  }

  res.redirect('/login'); // user not logged in
}

/* GET home page. */
router.get('/', (req, res) => {
  res.render('home');
});

// GET user signup page //
router.get('/signup', (req,res) => {
  res.render('signup');
});

// GET login page //
router.get('/login', (req, res) => {
  res.render('login');
});

// GET dashboard/profile //
router.get('/dashboard', isAuthenticated, (req, res) => {
  //res.send(`Welcome to your dashboard, ${req.session.user.username}`);
  res.render('dashboard');
});

// GET cities page
router.get('/cities', (req, res) => {
  res.render('cities');
});

module.exports = router;
