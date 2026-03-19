// IMPORTS
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const db = require('./db');

// Routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');


// APP SETUP
const app = express();
const port = 3000;


// VIEW ENGINE
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// MIDDLEWARE
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next(); // user logged in
  }

  res.redirect('/login'); // user not logged in
}


// SESSION (leave here (before routes))
app.use(session({
  secret: 'your-secret-key', // change later?
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => { // able to use <%= user %> in .ejs files
  res.locals.user = req.session.user || null;
  next();
}); 


// ROUTES
app.use('/', indexRouter);
app.use('/users', usersRouter);

// direct home route
app.get('/', (req, res) => {
  res.render('home');
});


// ERROR HANDLING

// Catch 404
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});


// START SERVER
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


// EXPORT (optional)
module.exports = app;