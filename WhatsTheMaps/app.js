// Imports
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

// App setup
const app = express();
const port = 3000;

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(
  session({
    secret: 'your-secret-key', // change later?
    resave: false,
    saveUninitialized: false
  })
);

app.use((req, res, next) => {
  // Makes <%= user %> available in EJS templates.
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Direct home route
app.get('/', (req, res) => {
  res.render('home');
});

// Leaderboard
app.get('/leaderboard', (req, res) => {
  const sql = `
    SELECT u.username, MAX(s.score) AS high_score
    FROM users u
    JOIN scores s ON u.id = s.user_id
    WHERE u.is_deleted = FALSE
    GROUP BY u.id
    ORDER BY high_score DESC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Error loading leaderboard');
    }

    res.render('leaderboard', { leaderboard: results });
  });
});

// Error handling
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

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Export
module.exports = app;
