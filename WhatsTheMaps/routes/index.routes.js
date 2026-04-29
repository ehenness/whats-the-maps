
module.exports = function createIndexRouter(deps = {}) {
  const express = require('express');
  const router = express.Router();

  const {
    redirectToLogin,
    calculateQuizResult,
    getCities,
    getRandomCity,
    getStates
  } = deps;

  // fallback to real implementations if not injected
  const authMiddleware = require('../middleware/auth.middleware');
  const gameController = require('../controllers/game.controller');

  router.get(
    '/dashboard',
    redirectToLogin || authMiddleware.redirectToLogin,
    require('../controllers/dashboard.controller').getDashboard
  );

  router.post('/cities/:cityId/game/submit', async (req, res) => {
    // IMPORTANT: call injected function if provided
    if (calculateQuizResult) {
      const result = await calculateQuizResult();
      return res.json({
        ...result,
        saved: false,
        savedMessage:
          'Log in to save this score to your dashboard and leaderboard.'
      });
    }

    return gameController.submitQuiz(req, res);
  });

  return router;
};