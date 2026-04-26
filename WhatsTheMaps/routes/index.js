/** Handles public page routes, city browsing, game pages, quiz submission */
const express = require('express');
const router = express.Router();
const runQuery = require('../lib/runQuery');
const { redirectToLogin } = require('../middleware/auth');
const { listPresetProfileImages } = require('../profileConfig');
const { dashboardErrorMessages, getDashboardProfile } = require('../services/dashboardService');
const { buildLoginViewModel } = require('../viewModels/authViewModels');
const {
  buildQuizForCity,
  calculateQuizResult,
  getCities,
  getRandomCity,
  getStates,
  toClientQuiz
} = require('../gameData');

// Render the main public pages and player-facing game screens
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
  res.render('login', buildLoginViewModel());
});

router.get('/dashboard', redirectToLogin, async (req, res) => {
  const isEditing = req.query.edit === '1';
  try {
    // The dashboard page built from profile data, stats, optional UI messages
    const dashboardData = await getDashboardProfile(req.session.user.id);

    if (!dashboardData) {
      return res.redirect('/login');
    }

    const presetAvatars = listPresetProfileImages();

    return res.render('dashboard', {
      isEditing,
      isReadOnlyProfile: false,
      isOwnProfile: true,
      profile: dashboardData.profile,
      presetAvatars,
      stats: dashboardData.stats,
      successMessage:
        req.query.updated === '1'
          ? 'Profile updated.'
          : req.query.scoreSaved === '1'
            ? 'Your guest quiz score has been saved to your profile.'
            : null,
      errorMessage: dashboardErrorMessages[req.query.error] || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading dashboard.');
  }
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

router.get('/cities', async (req, res) => {
  const selectedState = req.query.state || 'all';
  const selectedSort = req.query.sort || 'alpha-asc';

  try {
    // Load the visible city list, state filters, and random quiz shortcut together
    const [cities, randomCity, states] = await Promise.all([
      getCities({ state: selectedState, sort: selectedSort }),
      getRandomCity(),
      getStates()
    ]);

    return res.render('cities', {
      cities,
      randomCity,
      selectedSort,
      selectedState,
      states
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading cities.');
  }
});

router.get('/cities/:cityId/game', async (req, res) => {
  try {
    // Pre-build the quiz on the server so only playable cities render a game page
    const quiz = await buildQuizForCity(req.params.cityId);

    if (!quiz) {
      return res.status(404).send('City quiz not found.');
    }

    return res.render('game', {
      city: quiz.city,
      quizData: toClientQuiz(quiz)
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading city quiz.');
  }
});

// Quiz scoring stays server-side so the client cannot award itself points
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
    // Keep the latest guest score in the session so it can be saved right after login.
    req.session.pendingGuestScore = {
      totalPoints: result.totalPoints
    };

    return res.json({
      ...result,
      saved: false,
      savedMessage: 'Log in to save this score to your dashboard and leaderboard.'
    });
  }

  try {
    await runQuery('INSERT INTO scores (user_id, score) VALUES (?, ?)', [
      req.session.user.id,
      result.totalPoints
    ]);
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
});

module.exports = router;
