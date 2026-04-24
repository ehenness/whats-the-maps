const userService = require('../services/user.service');

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
    const user = await userService.login(email, password);

    req.session.user = user;

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


/*const { getDashboardProfile } = require('../services/dashboard.service');
const { maxBioLength } = require('../config/profileConfig');
const { deleteStoredProfile, getStoredProfile, saveStoredProfile } = require('../profileStore');

async function getUserId(req, res) {
  const requestedUserId = Number(req.params.userId);

  if (!Number.isInteger(requestedUserId) || requestedUserId <= 0) {
    return res.status(404).send('Player not found.');
  }

  if (req.session.user && Number(req.session.user.id) === requestedUserId) {
    return res.redirect('/dashboard');
  }

  try {
    const dashboardData = await getDashboardProfile(requestedUserId);

    if (!dashboardData) { 
      return res.status(404).send('Player not found.');
    }

    return res.render('dashboard', {
      isEditing: false,
      isReadOnlyProfile: true,
      isOwnProfile: false,
      profile: dashboardData.profile,
      presetAvatars: [],
      stats: dashboardData.stats,
      successMessage: null,
      errorMessage: null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading player profile.');
  }
};

async function getSignupPage(req, res) {
  return res.render('signup');
}

async function getLoginPage(req, res) {
  return res.render('login');
}

async function signup(req, res) {
  const { username, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';

    await runQuery(sql, [username, email, hashedPassword]);
    return res.redirect('/login');
  } catch (error) {
    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    return res.status(500).json({ error: 'Server error' });
  }
};

async function login(req, res) {
  const { email, password } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE';

  try {
    const results = await runQuery(sql, [email]);

    if (results.length === 0) {
      return res.status(400).send('User not found');
    }

    const user = results[0];
    const storedProfile = getStoredProfile(user.id) || {};
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(400).send('Incorrect password');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      bio: storedProfile.bio || '',
      profileImageUrl: storedProfile.profileImageUrl || null
    };

    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
};

async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }

    return res.redirect('/');
  });
};

async function updateProfile(req, res) {
  const bio = trimString(req.body.bio).slice(0, maxBioLength);
  const profileImage = getProfileImageFromRequest(req);

  if (profileImage.error) {
    return res.redirect('/dashboard?edit=1&error=image');
  }

  req.session.user = {
    ...req.session.user,
    bio,
    profileImageUrl: profileImage.profileImageUrl
  };

  const saved = saveStoredProfile(req.session.user.id, {
    bio,
    profileImageUrl: profileImage.profileImageUrl
  });

  if (!saved) {
    return res.redirect('/dashboard?edit=1&error=update');
  }

  return res.redirect('/dashboard?updated=1');
};

async function deleteAccount(req, res) {
  const userId = req.session.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).send('Password is required to delete your account.');
  }

  try {
    const selectUserSql = 'SELECT id, password, is_deleted FROM users WHERE id = ?';
    const results = await runQuery(selectUserSql, [userId]);
    if (results.length === 0 || results[0].is_deleted) {
      return res.status(404).send('Account not found.');
    }

    const passwordMatches = await bcrypt.compare(password, results[0].password);

    if (!passwordMatches) {
      return res.status(400).send('Incorrect password. Account not deleted.');
    }

    const deleteUserSql = 'UPDATE users SET is_deleted = TRUE WHERE id = ?';
    await runQuery(deleteUserSql, [userId]);
    deleteStoredProfile(userId);
    await destroySession(req);

    return res.redirect('/');
  } catch (error) {
    console.error(error);

    if (error instanceof Error && error.message === 'SESSION_DESTROY_FAILED') {
      return res.status(500).send('Account deleted, but there was an error logging you out.');
    }

    return res.status(500).send('Error deleting account.');
  }
};

module.exports = { getUserId, getSignupPage, getLoginPage, login, logout, updateProfile, deleteAccount };
*/