/** Builds dashboard profile data and stats for profile pages */

const { getStoredProfile } = require('../profileStore');
const runQuery = require('../lib/runQuery');

const dashboardErrorMessages = {
  image: 'That image could not be saved. Try a smaller file or image dimensions.',
  update: 'We could not save your profile changes.',
  user: 'We could not find that account.'
};

// Track the best rank a player has reached
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

// Dashboard stats combine aggregates from the user's games with leaderboard history
async function getDashboardStats(userId) {
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

  const [userStatsResults, scoreHistory] = await Promise.all([
    runQuery(userStatsSql, [userId]).catch((error) => {
      console.error(error);
      return [];
    }),
    runQuery(scoreHistorySql).catch((error) => {
      console.error(error);
      return [];
    })
  ]);
  const userStats = userStatsResults?.[0] || {};

  return {
    quizzesPlayed: Number(userStats.quizzesPlayed) || 0,
    totalPoints: Number(userStats.totalPoints) || 0,
    bestScore: Number(userStats.bestScore) || 0,
    averageScore: Math.round(Number(userStats.averageScore) || 0),
    highestLeaderboardRank: calculateHighestLeaderboardRank(userId, scoreHistory)
  };
}

// Merge database user info with the local profile store and computed stats
async function getDashboardProfile(userId) {
  const dashboardSql = 'SELECT id, username FROM users WHERE id = ? AND is_deleted = FALSE';
  const results = await runQuery(dashboardSql, [userId]);

  if (results.length === 0) {
    return null;
  }

  const dashboardUser = results[0];
  const storedProfile = getStoredProfile(userId) || {};
  const stats = await getDashboardStats(userId);

  return {
    profile: {
      userId: Number(dashboardUser.id),
      username: dashboardUser.username,
      bio: storedProfile.bio || '',
      profileImageUrl: storedProfile.profileImageUrl || null
    },
    stats
  };
}

module.exports = {
  dashboardErrorMessages,
  getDashboardProfile
};
