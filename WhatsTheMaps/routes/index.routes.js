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