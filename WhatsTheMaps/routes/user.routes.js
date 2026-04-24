const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');


router.post('/signup', userController.getSignupPage);
router.post('/login', userController.login);
router.get('/logout', userController.logout);
router.post('/update-profile', isAuthenticated, userController.updateProfile);
router.post('/delete-account', isAuthenticated, userController.deleteAccount);

module.exports = router;


/*const db = require('../repositories/db');
const {
  listPresetProfileImages,
  maxBioLength,
  maxUploadedImageLength
} = require('../profileConfig');
const {
  deleteStoredProfile,
  getStoredProfile,
  saveStoredProfile
} = require('../profileStore');


function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

function destroySession(req) {
  return new Promise((resolve, reject) => {
    req.session.destroy((error) => {
      if (error) {
        reject(new Error('SESSION_DESTROY_FAILED'));
        return;
      }

      resolve();
    });
  });
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function getProfileImageFromRequest(req) {
  const selectedAvatar = trimString(req.body.selectedAvatar);
  const uploadedImageData = trimString(req.body.uploadedImageData);
  const presetAvatars = listPresetProfileImages();

  if (uploadedImageData) {
    const looksLikeImage = uploadedImageData.startsWith('data:image/');
    const fitsUploadLimit = uploadedImageData.length <= maxUploadedImageLength;

    if (!looksLikeImage || !fitsUploadLimit) {
      return { error: 'image' };
    }

    return { profileImageUrl: uploadedImageData };
  }

  if (selectedAvatar && presetAvatars.includes(selectedAvatar)) {
    return { profileImageUrl: selectedAvatar };
  }

  return { profileImageUrl: req.session.user.profileImageUrl || null };
}

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.status(401).send('You must be logged in to manage your account.');
}

router.post('/signup', async (req, res) => {
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
});

router.post('/login', async (req, res) => {
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
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.send('Error logging out');
    }

    return res.redirect('/');
  });
});

router.post('/update-profile', isAuthenticated, (req, res) => {
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
});

router.post('/delete-account', isAuthenticated, async (req, res) => {
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
});

module.exports = router;
*/