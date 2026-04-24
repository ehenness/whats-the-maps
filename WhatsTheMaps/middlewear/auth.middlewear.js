function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect('/login');
}

function requireAuthApi(req, res, next) {
  if (req.session.user) {
    return next();
  }
  return res.status(401).send('You must be logged in.');
}

module.exports = {
  requireAuthApi,
  isAuthenticated
};
