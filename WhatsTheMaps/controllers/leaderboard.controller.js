// controllers/leaderboard.controller.js
const leaderboardService = require('../services/leaderboard.service');

async function getLeaderboardPage(req, res) {
  try {
    const data = await leaderboardService.getLeaderboards();
    return res.render('leaderboard', data);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error loading leaderboard');
  }
}

module.exports = { getLeaderboardPage };