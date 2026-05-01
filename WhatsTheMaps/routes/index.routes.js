const express = require('express');
const router = express.Router();

const pageController = require('../controllers/page.controller');
const dashboardController = require('../controllers/dashboard.controller');
const gameController = require('../controllers/game.controller');

const authMiddleware = require('../middleware/auth.middleware');


// Public pages
router.get('/', pageController.getHomePage);
router.get('/signup', pageController.getSignupPage);
router.get('/login', pageController.getLoginPage);

// Dashboard
router.get('/dashboard', authMiddleware.redirectToLogin, dashboardController.getDashboard);
router.get('/players/:userId', dashboardController.getPlayerProfile);

// Cities / Game
router.get('/cities', gameController.getCitiesPage);
router.get('/cities/:cityId/game', gameController.getGamePage);
router.post('/cities/:cityId/game/submit', gameController.submitQuiz);

module.exports = router;

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