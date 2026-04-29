module.exports = function createUsersRouter(deps = {}) {
  const express = require('express');
  const router = express.Router();

  const {
    runQuery,
    bcrypt,
    requireSessionUser
  } = deps;

  // use injected or fallback
  const userController = require('../controllers/user.controller');
  const authMiddleware = require('../middleware/auth.middleware');

  router.post('/login', userController.login);

  router.post(
    '/update-profile',
    requireSessionUser || authMiddleware.redirectToLogin,
    userController.updateProfile
  );

  return router;
};