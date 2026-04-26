/** Handles account sign-up, login, logout, profile updates, deletion */

const express = require('express');

// Deleting an account logs user out
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

// Trim text inputs
function trimString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Save the last guest score after login so players can keep the run they just finished.
async function savePendingGuestScore(req, userId, runQuery) {
  const pendingGuestScore = req.session.pendingGuestScore;

  if (!pendingGuestScore || !Number.isFinite(Number(pendingGuestScore.totalPoints))) {
    return false;
  }

  await runQuery('INSERT INTO scores (user_id, score) VALUES (?, ?)', [
    userId,
    Number(pendingGuestScore.totalPoints)
  ]);
  delete req.session.pendingGuestScore;

  return true;
}

// Accept preset avatar path or an uploaded data URL
function getProfileImageFromRequest(
  req,
  { listPresetProfileImages, maxUploadedImageLength }
) {
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

function createUsersRouter(dependencies = {}) {
  const bcrypt = dependencies.bcrypt || require('bcrypt');
  const runQuery = dependencies.runQuery || require('../lib/runQuery');
  const requireSessionUser =
    dependencies.requireSessionUser || require('../middleware/auth').requireSessionUser;
  const profileConfig = require('../profileConfig');
  const listPresetProfileImages =
    dependencies.listPresetProfileImages || profileConfig.listPresetProfileImages;
  const maxBioLength = dependencies.maxBioLength ?? profileConfig.maxBioLength;
  const maxUploadedImageLength =
    dependencies.maxUploadedImageLength ?? profileConfig.maxUploadedImageLength;
  const profileStore = require('../profileStore');
  const deleteStoredProfile = dependencies.deleteStoredProfile || profileStore.deleteStoredProfile;
  const getStoredProfile = dependencies.getStoredProfile || profileStore.getStoredProfile;
  const saveStoredProfile = dependencies.saveStoredProfile || profileStore.saveStoredProfile;
  const buildSessionUser =
    dependencies.buildSessionUser || require('../services/sessionUser').buildSessionUser;
  const buildLoginViewModel =
    dependencies.buildLoginViewModel || require('../viewModels/authViewModels').buildLoginViewModel;
  const router = express.Router();

  router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
      // Passwords are stored as bcrypt hashes before the user record is saved
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
    const email = trimString(req.body.email);
    const password = req.body.password;
    const sql = 'SELECT * FROM users WHERE email = ? AND is_deleted = FALSE';
    const invalidCredentialsMessage = 'No user found with that email and password';

    try {
      const results = await runQuery(sql, [email]);

      if (results.length === 0) {
        return res.status(401).render(
          'login',
          buildLoginViewModel({
            errorMessage: invalidCredentialsMessage,
            email
          })
        );
      }

      const user = results[0];
      const storedProfile = getStoredProfile(user.id) || {};
      const passwordMatches = await bcrypt.compare(password, user.password);

      if (!passwordMatches) {
        return res.status(401).render(
          'login',
          buildLoginViewModel({
            errorMessage: invalidCredentialsMessage,
            email
          })
        );
      }

      // Keep only the fields the app needs in the session object
      req.session.user = buildSessionUser(user, storedProfile);
      const savedGuestScore = await savePendingGuestScore(req, user.id, runQuery);

      return res.redirect(savedGuestScore ? '/dashboard?scoreSaved=1' : '/');
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

  router.post('/update-profile', requireSessionUser, (req, res) => {
    const bio = trimString(req.body.bio).slice(0, maxBioLength);
    const profileImage = getProfileImageFromRequest(req, {
      listPresetProfileImages,
      maxUploadedImageLength
    });

    if (profileImage.error) {
      return res.redirect('/dashboard?edit=1&error=image');
    }

    // Save profile fields both in the session and in the JSON profile store
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

  router.post('/delete-account', requireSessionUser, async (req, res) => {
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

  return router;
}

module.exports = createUsersRouter;
module.exports.createUsersRouter = createUsersRouter;
