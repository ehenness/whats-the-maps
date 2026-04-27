/** AI (Codex) was used to help write this file */

/** Builds the Express app with injectable dependencies for tests */
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

const createIndexRouter = require('./routes/index');
const createUsersRouter = require('./routes/users');

function loadLeaderboardService() {
  return require('./services/leaderboardService');
}

function createApp({
  getLeaderboards = (...args) => loadLeaderboardService().getLeaderboards(...args),
  indexRouter,
  usersRouter,
  sessionSecret = process.env.SESSION_SECRET || 'your-secret-key'
} = {}) {
  const app = express();
  const requestBodyLimit = '12mb';
  const resolvedIndexRouter = indexRouter || createIndexRouter();
  const resolvedUsersRouter = usersRouter || createUsersRouter();

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');

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

  app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
  });

  app.use('/', resolvedIndexRouter);
  app.use('/users', resolvedUsersRouter);

  app.get('/leaderboard', async (req, res) => {
    try {
      return res.render('leaderboard', await getLeaderboards());
    } catch (error) {
      console.error(error);
      return res.send('Error loading leaderboard');
    }
  });

  app.use((req, res, next) => {
    next(createError(404));
  });

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

  return app;
}

module.exports = {
  createApp
};
