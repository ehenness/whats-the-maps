const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
const db = require('./repositories/db');

const indexRouter = require('./routes/index.routes');
const usersRouter = require('./routes/user.routes');

const app = express();
const port = process.env.PORT || 3000;
const requestBodyLimit = '12mb';
const sessionSecret = process.env.SESSION_SECRET || 'your-secret-key';
const leaderboardSql = `
  SELECT u.id AS user_id, u.username, MAX(s.score) AS high_score
  FROM users u
  JOIN scores s ON u.id = s.user_id
  WHERE u.is_deleted = FALSE
  GROUP BY u.id
  ORDER BY high_score DESC
  LIMIT 10
`;

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

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.get('/leaderboard', (req, res) => {
  db.query(leaderboardSql, (err, results) => {
    if (err) {
      console.error(err);
      return res.send('Error loading leaderboard');
    }

    return res.render('leaderboard', { leaderboard: results });
  });
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;
