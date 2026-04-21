/** Configures Express app, shared middleware, top-level routes */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const { getLeaderboards } = require('./services/leaderboardService');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();
const port = process.env.PORT || 3000;
const requestBodyLimit = '12mb';
const sessionSecret = process.env.SESSION_SECRET || 'your-secret-key';

// Register view folder and template engine used by page routes
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Core middleware configured here
app.use(logger('dev'));
app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
  })
);

// Make current signed-in user available to every EJS template
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Feature routers handle main site pages and account actions
app.use('/', indexRouter);
app.use('/users', usersRouter);

// Leaderboard kept at app level
app.get('/leaderboard', async (req, res) => {
  try {
    return res.render('leaderboard', await getLeaderboards());
  } catch (error) {
    console.error(error);
    return res.send('Error loading leaderboard');
  }
});

// Forward unknown routes into shared error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Render friendly error pages for request and server failures
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    res.locals.message = 'The uploaded image is too large. Please try a slightly smaller file.';
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(413);
    return res.render('error');
  }

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

// `npm start` boots through `bin/www`, but keeps `node app.js` working
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = app;
