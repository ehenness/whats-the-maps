/** Holds reusable middleware for routes that depend on a logged-in user. */

// Page routes redirect guests to the login page, while account actions return an error.
function redirectToLogin(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect('/login');
}

function requireSessionUser(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.status(401).send('You must be logged in to manage your account.');
}

module.exports = {
  redirectToLogin,
  requireSessionUser
};
