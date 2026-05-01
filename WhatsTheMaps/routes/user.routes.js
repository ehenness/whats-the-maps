const express = require('express');

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { listPresetProfileImages, maxBioLength, maxUploadedImageLength } = require('../config/profileConfig');
const { saveStoredProfile, getStoredProfile } = require('../profileStore');
const { trimString } = require('../utils/profile.util');
const { buildSessionUser } = require('../utils/session.util');

function createInjectedLoginHandler({
  bcrypt,
  buildLoginViewModel,
  buildSessionUser: buildInjectedSessionUser,
  getStoredProfile: getInjectedStoredProfile,
  runQuery
}) {
  return async function login(req, res) {
    const email = trimString(req.body.email);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    try {
      const users = await runQuery('SELECT * FROM users WHERE email = ? AND is_deleted = FALSE', [email]);
      const user = users[0];
      const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

      if (!user || !passwordMatches) {
        return res.status(401).render(
          'login',
          buildLoginViewModel({
            errorMessage: 'No user found with that email and password',
            email
          })
        );
      }

      const storedProfile = (getInjectedStoredProfile || getStoredProfile)(user.id) || {};
      req.session.user = (buildInjectedSessionUser || buildSessionUser)(user, storedProfile);

      if (req.session.pendingGuestScore) {
        await runQuery('INSERT INTO scores (user_id, score) VALUES (?, ?)', [
          user.id,
          req.session.pendingGuestScore.totalPoints
        ]);
        delete req.session.pendingGuestScore;
        return res.redirect('/dashboard?scoreSaved=1');
      }

      return res.redirect('/');
    } catch (error) {
      console.error(error);

      return res.status(401).render(
        'login',
        buildLoginViewModel({
          errorMessage: 'No user found with that email and password',
          email
        })
      );
    }
  };
}

function createInjectedUpdateProfileHandler({
  buildSessionUser: buildInjectedSessionUser,
  getStoredProfile: getInjectedStoredProfile,
  listPresetProfileImages: listInjectedPresetProfileImages,
  maxBioLength: injectedMaxBioLength,
  maxUploadedImageLength: injectedMaxUploadedImageLength,
  saveStoredProfile: saveInjectedStoredProfile
}) {
  return async function updateProfile(req, res) {
    const allowedAvatars = (listInjectedPresetProfileImages || listPresetProfileImages)();
    const bio = trimString(req.body.bio).slice(0, injectedMaxBioLength ?? maxBioLength);
    const selectedAvatar = trimString(req.body.selectedAvatar);
    const uploadedImageData = trimString(req.body.uploadedImageData);
    let profileImageUrl = req.session.user.profileImageUrl || null;

    if (uploadedImageData) {
      const looksLikeImage = uploadedImageData.startsWith('data:image/');
      const fitsLimit = uploadedImageData.length <= (injectedMaxUploadedImageLength ?? maxUploadedImageLength);

      if (!looksLikeImage || !fitsLimit) {
        return res.redirect('/dashboard?edit=1&error=image');
      }

      profileImageUrl = uploadedImageData;
    } else if (selectedAvatar && allowedAvatars.includes(selectedAvatar)) {
      profileImageUrl = selectedAvatar;
    }

    const saved = (saveInjectedStoredProfile || saveStoredProfile)(req.session.user.id, {
      bio,
      profileImageUrl
    });

    if (!saved) {
      return res.redirect('/dashboard?edit=1&error=update');
    }

    const storedProfile = (getInjectedStoredProfile || getStoredProfile)(req.session.user.id) || {
      bio,
      profileImageUrl
    };

    req.session.user = (buildInjectedSessionUser || buildSessionUser)(req.session.user, storedProfile);
    return res.redirect('/dashboard?updated=1');
  };
}

module.exports = function createUsersRouter(deps = {}) {
  const router = express.Router();
  const hasInjectedLoginDeps =
    typeof deps.runQuery === 'function' &&
    deps.bcrypt &&
    typeof deps.buildLoginViewModel === 'function';

  const hasInjectedProfileDeps =
    typeof deps.saveStoredProfile === 'function' ||
    typeof deps.getStoredProfile === 'function' ||
    typeof deps.listPresetProfileImages === 'function';

  router.post('/signup', userController.signup);

  if (hasInjectedLoginDeps) {
    router.post('/login', createInjectedLoginHandler(deps));
  } else {
    router.post('/login', userController.login);
  }

  router.get('/logout', userController.logout);

  router.post(
    '/update-profile',
    deps.requireSessionUser || authMiddleware.redirectToLogin,
    hasInjectedProfileDeps ? createInjectedUpdateProfileHandler(deps) : userController.updateProfile
  );

  router.post('/delete-account', authMiddleware.redirectToLogin, userController.deleteAccount);

  return router;
};
