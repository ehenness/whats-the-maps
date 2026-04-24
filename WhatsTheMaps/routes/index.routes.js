const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const gameController = require('../controllers/game.controller');
const pageController = require('../controllers/page.controller');

const { isAuthenticated } = require('../middlewear/auth.middlewear');


// Public pages
router.get('/', gameController.getHomePage);
router.get('/signup', pageController.getSignupPage);
router.get('/login', pageController.getLoginPage);

// Dashboard
router.get('/dashboard', isAuthenticated, dashboardController.getDashboard);
router.get('/players/:userId', dashboardController.getPlayerProfile);

// Cities / Game
router.get('/cities', gameController.getCitiesPage);
router.get('/cities/:cityId/game', gameController.getGamePage);
router.post('/cities/:cityId/game/submit', gameController.submitQuiz);

module.exports = router;


/*
const db = require('../repositories/db');
const { listPresetProfileImages } = require('../profileConfig');
const { getStoredProfile } = require('../profileStore');
const {
  buildQuizForCity,
  calculateQuizResult,
  getCities,
  getRandomCity,
  getStates,
  toClientQuiz
} = require('../gameData');
 

router.get('/', async (req, res) => {
  try {
    return res.render('home', {
      randomCity: await getRandomCity()
    });
  } catch (error) {
    console.error(error);
    return res.render('home', {
      randomCity: null
    });
  }
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/players/:userId', async (req, res) => {
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
});



router.post('/cities/:cityId/game/submit', async (req, res) => {
  const responses = Array.isArray(req.body.responses) ? req.body.responses : [];
  let result;

  try {
    result = await calculateQuizResult(req.params.cityId, responses);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'We could not score that quiz right now.' });
  }

  if (!result) {
    return res.status(404).json({ error: 'City quiz not found.' });
  }

  if (!req.session.user) {
    return res.json({
      ...result,
      saved: false,
      savedMessage: 'Log in to save your score to the dashboard.'
    });
  }
});

module.exports = router;
*/