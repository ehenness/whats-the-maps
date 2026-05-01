const express = require('express');

const pageController = require('../controllers/page.controller');
const dashboardController = require('../controllers/dashboard.controller');
const gameController = require('../controllers/game.controller');
const authMiddleware = require('../middleware/auth.middleware');
const scoreRepository = require('../repositories/score.repository');

function createInjectedSubmitQuizHandler({ calculateQuizResult, runQuery }) {
  return async function submitQuiz(req, res) {
    const responses = Array.isArray(req.body.responses) ? req.body.responses : [];

    try {
      const result = await calculateQuizResult(req.params.cityId, responses);

      if (!result) {
        return res.status(404).json({ error: 'City quiz not found.' });
      }

      if (!req.session.user) {
        req.session.pendingGuestScore = result;

        return res.json({
          ...result,
          saved: false,
          savedMessage: 'Log in to save this score to your dashboard and leaderboard.'
        });
      }

      try {
        if (typeof runQuery === 'function') {
          await runQuery('INSERT INTO scores (user_id, score) VALUES (?, ?)', [
            req.session.user.id,
            result.totalPoints
          ]);
        } else {
          await scoreRepository.saveScore(req.session.user.id, result.totalPoints);
        }

        return res.json({
          ...result,
          saved: true,
          savedMessage: 'Your score has been saved.'
        });
      } catch (error) {
        console.error(error);

        return res.json({
          ...result,
          saved: false,
          savedMessage: 'Your score was calculated, but it could not be saved.'
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'We could not score that quiz right now.' });
    }
  };
}

module.exports = function createIndexRouter(deps = {}) {
  const router = express.Router();
  const {
    redirectToLogin = authMiddleware.redirectToLogin,
    calculateQuizResult,
    runQuery
  } = deps;

  router.get('/', pageController.getHomePage);
  router.get('/signup', pageController.getSignupPage);
  router.get('/login', pageController.getLoginPage);

  router.get('/dashboard', redirectToLogin, dashboardController.getDashboard);
  router.get('/players/:userId', dashboardController.getPlayerProfile);

  router.get('/cities', gameController.getCitiesPage);
  router.get('/cities/:cityId/game', gameController.getGamePage);

  if (typeof calculateQuizResult === 'function') {
    router.post(
      '/cities/:cityId/game/submit',
      createInjectedSubmitQuizHandler({ calculateQuizResult, runQuery })
    );
  } else {
    router.post('/cities/:cityId/game/submit', gameController.submitQuiz);
  }

  return router;
};
