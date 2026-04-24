const userService = require('../services/user.service');
const { buildSessionUser } = require('../utils/session.util');

async function signup(req, res) {
  const { username, email, password } = req.body;

  try {
    await userService.signup(username, email, password);
    return res.redirect('/login');
  } catch (error) {
    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    return res.status(500).json({ error: 'Server error' });
  }
}


async function login(req, res) {
  const { email, password } = req.body;

  try {
    const { user, storedProfile } = await userService.login(email, password);

    req.session.user = buildSessionUser(user, storedProfile);

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(400).send(error.message);
  }
}

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }
    return res.redirect('/');
  });
}

async function updateProfile(req, res) {
  try {
    const result = await userService.updateProfile(req.session.user, req.body);

    if (result.error) {
      return res.redirect(`/dashboard?edit=1&error=${result.error}`);
    }

    // update session AFTER success
    req.session.user = result.updatedUser;

    return res.redirect('/dashboard?updated=1');

  } catch (error) {
    console.error(error);
    return res.redirect('/dashboard?edit=1&error=update');
  }
}

async function deleteAccount(req, res) {
  const userId = req.session.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).send('Password is required.');
  }

  try {
    await userService.deleteAccount(userId, password);

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).send('Account deleted, but logout failed.');
      }
      return res.redirect('/');
    });

  } catch (error) {
    console.error(error);
    return res.status(400).send(error.message);
  }
}

module.exports = {
  signup,
  login,
  logout,
  updateProfile,
  deleteAccount
};