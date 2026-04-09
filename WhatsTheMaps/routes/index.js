const express = require('express');
const router = express.Router();
const db = require('../db');
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

const dashboardErrorMessages = {
  image: 'That image could not be saved. Try a smaller file or image dimensions.',
  update: 'We could not save your profile changes.',
  user: 'We could not find that account.'
};

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }

  return res.redirect('/login');
}

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

function calculateHighestLeaderboardRank(userId, scoreHistory = []) {
  const bestScoreByUser = new Map();
  let highestRank = null;

  scoreHistory.forEach((entry) => {
    const entryUserId = Number(entry.userId);
    const score = Number(entry.score) || 0;
    const previousBest = bestScoreByUser.get(entryUserId) || 0;

    if (score <= previousBest) {
      return;
    }

    bestScoreByUser.set(entryUserId, score);

    if (entryUserId !== Number(userId)) {
      return;
    }

    const rank =
      1 +
      [...bestScoreByUser.entries()].filter(
        ([otherUserId, otherUserBest]) => otherUserId !== entryUserId && otherUserBest > score
      ).length;

    highestRank = highestRank === null ? rank : Math.min(highestRank, rank);
  });

  return highestRank;
}

function getDashboardStats(userId) {
  const userStatsSql = `
    SELECT
      COUNT(*) AS quizzesPlayed,
      COALESCE(SUM(score), 0) AS totalPoints,
      COALESCE(MAX(score), 0) AS bestScore,
      COALESCE(AVG(score), 0) AS averageScore
    FROM scores
    WHERE user_id = ?
  `;
  const scoreHistorySql = `
    SELECT
      s.user_id AS userId,
      s.score AS score
    FROM users u
    JOIN scores s ON u.id = s.user_id
    WHERE u.is_deleted = FALSE
    ORDER BY s.played_at ASC, s.id ASC
  `;

  return Promise.all([
    runQuery(userStatsSql, [userId]).catch((error) => {
      console.error(error);
      return [];
    }),
    runQuery(scoreHistorySql).catch((error) => {
      console.error(error);
      return [];
    })
  ]).then(([userStatsResults, scoreHistory]) => {
    const userStats = userStatsResults?.[0] || {};

    return {
      quizzesPlayed: Number(userStats.quizzesPlayed) || 0,
      totalPoints: Number(userStats.totalPoints) || 0,
      bestScore: Number(userStats.bestScore) || 0,
      averageScore: Math.round(Number(userStats.averageScore) || 0),
      highestLeaderboardRank: calculateHighestLeaderboardRank(userId, scoreHistory)
    };
  });
}

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

router.get('/dashboard', isAuthenticated, async (req, res) => {
  const isEditing = req.query.edit === '1';
  const dashboardSql = 'SELECT username, email FROM users WHERE id = ? AND is_deleted = FALSE';
  try {
    const results = await runQuery(dashboardSql, [req.session.user.id]);
    if (results.length === 0) {
      return res.redirect('/login');
    }

    const dashboardUser = results[0];
    const storedProfile = getStoredProfile(req.session.user.id) || {};
    const presetAvatars = listPresetProfileImages();
    const stats = await getDashboardStats(req.session.user.id);

    return res.render('dashboard', {
      isEditing,
      profile: {
        username: dashboardUser.username,
        bio: storedProfile.bio || '',
        profileImageUrl: storedProfile.profileImageUrl || null
      },
      presetAvatars,
      stats,
      successMessage: req.query.updated === '1' ? 'Profile updated.' : null,
      errorMessage: dashboardErrorMessages[req.query.error] || null
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Error loading dashboard.');
  }
});

router.get('/cities', async (req, res) => {
  const selectedState = req.query.state || 'all';
  const selectedSort = req.query.sort || 'alpha-asc';

  try {
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

  db.query(
    'INSERT INTO scores (user_id, score) VALUES (?, ?)',
    [req.session.user.id, result.totalPoints],
    (saveErr) => {
      if (saveErr) {
        console.error(saveErr);
        return res.json({
          ...result,
          saved: false,
          savedMessage: 'Your score was calculated, but it could not be saved.'
        });
      }

      return res.json({
        ...result,
        saved: true,
        savedMessage: 'Your score has been saved.'
      });
    }
  );
});

module.exports = router;
